import test from 'node:test';
import assert from 'node:assert';
import app from '../app';
import http from 'node:http';

// Helper for HTTP requests in test
function request(path: string, options: http.RequestOptions = {}, body?: string): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      const port = address.port;

      const req = http.request({
        host: '127.0.0.1',
        port,
        path,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          server.close();
          try {
            resolve({
              statusCode: res.statusCode || 500,
              data: rawData ? JSON.parse(rawData) : null
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode || 500,
              data: rawData
            });
          }
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  });
}

test('GET /api/v1/health returns ok status and service identity', async () => {
  const res = await request('/api/v1/health');
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.data.status, 'ok');
  assert.strictEqual(res.data.service, 'Somi Go API');
});

test('Protected route /api/v1/orders rejects request with missing token (401)', async () => {
  const res = await request('/api/v1/orders');
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.data.code, 'AUTH_TOKEN_MISSING');
});

test('Protected route /api/v1/orders rejects request with invalid bearer token (401)', async () => {
  const res = await request('/api/v1/orders', {
    headers: {
      'Authorization': 'Bearer fake_invalid_jwt_token_12345'
    }
  });
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.data.code, 'AUTH_TOKEN_INVALID');
});

test('Protected route /api/v1/me rejects request with empty bearer token (401)', async () => {
  const res = await request('/api/v1/me', {
    headers: {
      'Authorization': 'Bearer '
    }
  });
  assert.strictEqual(res.statusCode, 401);
});

test('Protected route /api/v1/cart rejects unauthenticated access (401)', async () => {
  const res = await request('/api/v1/cart');
  assert.strictEqual(res.statusCode, 401);
});

test('Public route /api/v1/restaurants allows public discovery without authentication', async () => {
  const res = await request('/api/v1/restaurants');
  // Returns either 200 with list or 500 if DB env unset in local runner, never 401
  assert.notStrictEqual(res.statusCode, 401);
});
