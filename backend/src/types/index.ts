import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedUser {
  id?: number;
  firebaseUid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'DELIVERY_PARTNER' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

export interface AuthenticatedRequest extends Request {
  firebaseUser?: DecodedIdToken;
  appUser?: AuthenticatedUser;
}

export interface CreateAddressDto {
  addressLine: string;
  apartment?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  addressType?: string;
  isDefault?: boolean;
}

export interface PlaceOrderDto {
  restaurantId: number;
  deliveryAddressId: number;
  items?: Array<{
    menuItemId: number;
    quantity: number;
    variantName?: string;
  }>;
  tip?: number;
  couponCode?: string;
  paymentMethod?: string;
}

export interface CartItemDto {
  menuItemId: number;
  quantity: number;
  variantName?: string;
  addons?: string[];
}
