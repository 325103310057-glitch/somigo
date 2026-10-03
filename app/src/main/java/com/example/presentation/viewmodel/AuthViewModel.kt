package com.example.presentation.viewmodel

import android.content.Context
import android.util.Log
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.BuildConfig
import com.example.data.local.SessionManager
import com.example.data.remote.BiteDashApiService
import com.example.data.remote.RetrofitClient
import com.example.data.remote.dto.AuthTokenResponseDto
import com.example.data.remote.dto.FirebaseAuthRequestDto
import com.example.data.remote.dto.LoginRequestDto
import com.example.data.remote.dto.RegisterRequestDto
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class CustomerProfile(
    val userId: Int = 0,
    val fullName: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val profileImageUrl: String = "",
    val firebaseUid: String = "",
    val role: String = "CUSTOMER"
)

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val user: AuthTokenResponseDto) : AuthState()
    data class Error(val message: String, val isConfigNotice: Boolean = false) : AuthState()
}

class AuthViewModel(
    private val apiService: BiteDashApiService = RetrofitClient.apiService
) : ViewModel() {

    private val tag = "AuthViewModel"

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState = _authState.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(SessionManager.hasValidSession())
    val isLoggedIn = _isLoggedIn.asStateFlow()

    private val _customerProfile = MutableStateFlow(
        if (SessionManager.hasValidSession()) {
            CustomerProfile(
                userId = SessionManager.getStoredUserId(),
                fullName = SessionManager.getStoredFullName() ?: "Customer",
                email = SessionManager.getStoredEmail() ?: "",
                phoneNumber = SessionManager.getStoredPhone() ?: "",
                firebaseUid = SessionManager.getStoredFirebaseUid() ?: "",
                profileImageUrl = SessionManager.getStoredPhotoUrl() ?: ""
            )
        } else {
            CustomerProfile()
        }
    )
    val customerProfile = _customerProfile.asStateFlow()

    init {
        restoreExistingSession()
    }

    private fun restoreExistingSession() {
        try {
            val fbUser = FirebaseAuth.getInstance().currentUser
            if (fbUser != null && !SessionManager.hasValidSession()) {
                viewModelScope.launch {
                    try {
                        val tokenResult = fbUser.getIdToken(false).await()
                        val idToken = tokenResult.token
                        if (!idToken.isNullOrBlank()) {
                            syncFirebaseTokenWithBackend(
                                idToken = idToken,
                                displayName = fbUser.displayName,
                                email = fbUser.email,
                                photoUrl = fbUser.photoUrl?.toString(),
                                phone = fbUser.phoneNumber,
                                onSuccess = {}
                            )
                        }
                    } catch (e: Exception) {
                        Log.w(tag, "Failed to restore Firebase session: ${e.message}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(tag, "Firebase not yet initialized: ${e.message}")
        }
    }

    /**
     * Real Google Sign-In using Android Credential Manager + Firebase Authentication.
     */
    fun signInWithGoogle(context: Context, onAuthSuccess: () -> Unit) {
        val webClientId = BuildConfig.WEB_CLIENT_ID.trim()
        if (webClientId.isBlank()) {
            _authState.value = AuthState.Error(
                "Google Sign-In configuration required: Please add your WEB_CLIENT_ID to your .env or build configuration to enable Google account chooser.",
                isConfigNotice = true
            )
            return
        }

        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val credentialManager = CredentialManager.create(context)
                val googleIdOption = GetGoogleIdOption.Builder()
                    .setFilterByAuthorizedAccounts(false)
                    .setServerClientId(webClientId)
                    .setAutoSelectEnabled(false)
                    .build()

                val request = GetCredentialRequest.Builder()
                    .addCredentialOption(googleIdOption)
                    .build()

                val result = credentialManager.getCredential(context = context, request = request)
                val credential = result.credential

                if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                    val googleIdToken = googleIdTokenCredential.idToken

                    // Authenticate with Firebase Authentication
                    val firebaseAuth = FirebaseAuth.getInstance()
                    val authCredential = GoogleAuthProvider.getCredential(googleIdToken, null)
                    val authResult = firebaseAuth.signInWithCredential(authCredential).await()
                    val firebaseUser = authResult.user

                    if (firebaseUser == null) {
                        _authState.value = AuthState.Error("Firebase authentication failed. Please try again.")
                        return@launch
                    }

                    val tokenResult = firebaseUser.getIdToken(false).await()
                    val firebaseIdToken = tokenResult.token
                    if (firebaseIdToken.isNullOrBlank()) {
                        _authState.value = AuthState.Error("Failed to obtain secure Firebase ID token.")
                        return@launch
                    }

                    // Send verified Firebase ID token to Backend
                    syncFirebaseTokenWithBackend(
                        idToken = firebaseIdToken,
                        displayName = firebaseUser.displayName ?: googleIdTokenCredential.displayName,
                        email = firebaseUser.email ?: googleIdTokenCredential.id,
                        photoUrl = firebaseUser.photoUrl?.toString() ?: googleIdTokenCredential.profilePictureUri?.toString(),
                        phone = firebaseUser.phoneNumber,
                        onSuccess = onAuthSuccess
                    )
                } else {
                    _authState.value = AuthState.Error("Unexpected credential format returned from Google Sign-In.")
                }
            } catch (e: GetCredentialCancellationException) {
                Log.d(tag, "Google Sign-In was cancelled by user")
                _authState.value = AuthState.Idle
            } catch (e: NoCredentialException) {
                _authState.value = AuthState.Error("No Google accounts found on device. Please add a Google account in Android settings.")
            } catch (e: GetCredentialException) {
                Log.e(tag, "Credential Manager error: ${e.message}", e)
                _authState.value = AuthState.Error("Google Sign-In failed: ${e.localizedMessage ?: "Unknown error"}")
            } catch (e: Exception) {
                Log.e(tag, "Authentication error: ${e.message}", e)
                _authState.value = AuthState.Error("Sign-In failed: ${e.localizedMessage ?: "Network or configuration error"}")
            }
        }
    }

    private suspend fun syncFirebaseTokenWithBackend(
        idToken: String,
        displayName: String?,
        email: String?,
        photoUrl: String?,
        phone: String?,
        onSuccess: () -> Unit
    ) {
        try {
            val response = apiService.authenticateWithFirebase(
                FirebaseAuthRequestDto(
                    idToken = idToken,
                    displayName = displayName,
                    email = email,
                    photoUrl = photoUrl,
                    phoneNumber = phone
                )
            )

            if (response.isSuccessful && response.body() != null) {
                val tokenResponse = response.body()!!
                SessionManager.saveSession(
                    token = tokenResponse.accessToken,
                    userId = tokenResponse.userId,
                    fullName = tokenResponse.fullName,
                    email = email ?: tokenResponse.email,
                    phone = phone,
                    firebaseUid = tokenResponse.firebaseUid,
                    photoUrl = photoUrl ?: tokenResponse.profileImageUrl
                )

                _customerProfile.value = CustomerProfile(
                    userId = tokenResponse.userId,
                    fullName = tokenResponse.fullName,
                    email = email ?: tokenResponse.email ?: "",
                    phoneNumber = phone ?: "",
                    firebaseUid = tokenResponse.firebaseUid ?: "",
                    profileImageUrl = photoUrl ?: tokenResponse.profileImageUrl ?: "",
                    role = tokenResponse.role
                )

                _isLoggedIn.value = true
                _authState.value = AuthState.Success(tokenResponse)
                onSuccess()
            } else {
                val errBody = response.errorBody()?.string() ?: "Server authentication error (${response.code()})"
                Log.e(tag, "Backend sync error: $errBody")
                _authState.value = AuthState.Error("Backend synchronization failed: $errBody")
            }
        } catch (e: Exception) {
            Log.e(tag, "Network error during backend sync: ${e.message}", e)
            _authState.value = AuthState.Error("Cannot connect to SomiGo backend. Please check network or backend URL: ${e.localizedMessage}")
        }
    }

    fun login(emailInput: String, pass: String, onSuccess: () -> Unit) {
        val email = emailInput.trim()
        if (email.isBlank() || pass.isBlank()) {
            _authState.value = AuthState.Error("Please enter your registered email and password.")
            return
        }

        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = apiService.login(LoginRequestDto(email = email, password = pass))
                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!
                    SessionManager.saveSession(
                        token = user.accessToken,
                        userId = user.userId,
                        fullName = user.fullName,
                        email = email,
                        phone = null,
                        firebaseUid = user.firebaseUid,
                        photoUrl = user.profileImageUrl
                    )
                    _customerProfile.value = CustomerProfile(
                        userId = user.userId,
                        fullName = user.fullName,
                        email = email,
                        phoneNumber = "",
                        firebaseUid = user.firebaseUid ?: "",
                        profileImageUrl = user.profileImageUrl ?: "",
                        role = user.role
                    )
                    _isLoggedIn.value = true
                    _authState.value = AuthState.Success(user)
                    onSuccess()
                } else {
                    val err = response.errorBody()?.string() ?: "Invalid email or password."
                    _authState.value = AuthState.Error("Login failed: $err")
                }
            } catch (e: Exception) {
                Log.e(tag, "Login exception: ${e.message}", e)
                _authState.value = AuthState.Error("Connection error: Unable to reach backend server. ${e.localizedMessage}")
            }
        }
    }

    fun register(name: String, email: String, phone: String, pass: String, onSuccess: () -> Unit) {
        if (name.isBlank() || email.isBlank() || phone.isBlank() || pass.isBlank()) {
            _authState.value = AuthState.Error("Please fill in all registration fields.")
            return
        }

        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = apiService.register(
                    RegisterRequestDto(
                        fullName = name.trim(),
                        email = email.trim(),
                        phoneNumber = phone.trim(),
                        password = pass
                    )
                )
                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!
                    SessionManager.saveSession(
                        token = user.accessToken,
                        userId = user.userId,
                        fullName = user.fullName,
                        email = email.trim(),
                        phone = phone.trim(),
                        firebaseUid = user.firebaseUid,
                        photoUrl = user.profileImageUrl
                    )
                    _customerProfile.value = CustomerProfile(
                        userId = user.userId,
                        fullName = user.fullName,
                        email = email.trim(),
                        phoneNumber = phone.trim(),
                        firebaseUid = user.firebaseUid ?: "",
                        profileImageUrl = user.profileImageUrl ?: "",
                        role = user.role
                    )
                    _isLoggedIn.value = true
                    _authState.value = AuthState.Success(user)
                    onSuccess()
                } else {
                    val err = response.errorBody()?.string() ?: "Registration failed."
                    _authState.value = AuthState.Error("Registration failed: $err")
                }
            } catch (e: Exception) {
                Log.e(tag, "Registration exception: ${e.message}", e)
                _authState.value = AuthState.Error("Connection error: Unable to reach backend server. ${e.localizedMessage}")
            }
        }
    }

    fun updateProfile(name: String, email: String, phone: String, onDone: () -> Unit = {}) {
        val current = _customerProfile.value
        val updated = current.copy(
            fullName = name.trim().ifBlank { current.fullName },
            email = email.trim().ifBlank { current.email },
            phoneNumber = phone.trim().ifBlank { current.phoneNumber }
        )
        _customerProfile.value = updated
        if (SessionManager.hasValidSession()) {
            SessionManager.saveSession(
                token = SessionManager.authToken ?: "",
                userId = updated.userId,
                fullName = updated.fullName,
                email = updated.email,
                phone = updated.phoneNumber,
                firebaseUid = updated.firebaseUid,
                photoUrl = updated.profileImageUrl
            )
        }
        onDone()
    }

    fun deleteAccount(onComplete: () -> Unit) {
        viewModelScope.launch {
            try {
                FirebaseAuth.getInstance().currentUser?.delete()?.await()
            } catch (e: Exception) {
                Log.w(tag, "Firebase account delete error: ${e.message}")
            }
            logout()
            onComplete()
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                FirebaseAuth.getInstance().signOut()
            } catch (e: Exception) {
                Log.w(tag, "Firebase sign out error: ${e.message}")
            }
            try {
                apiService.logout()
            } catch (e: Exception) {
                Log.w(tag, "Backend logout call error: ${e.message}")
            }
            SessionManager.clearSession()
            _customerProfile.value = CustomerProfile()
            _isLoggedIn.value = false
            _authState.value = AuthState.Idle
        }
    }

    fun resetError() {
        _authState.value = AuthState.Idle
    }
}
