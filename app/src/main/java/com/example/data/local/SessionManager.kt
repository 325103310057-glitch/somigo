package com.example.data.local

import android.content.Context
import android.content.SharedPreferences

object SessionManager {
    private const val PREF_NAME = "somigo_session"
    private const val KEY_ACCESS_TOKEN = "access_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_FULL_NAME = "full_name"
    private const val KEY_EMAIL = "email"
    private const val KEY_PHONE = "phone"
    private const val KEY_FIREBASE_UID = "firebase_uid"
    private const val KEY_PHOTO_URL = "photo_url"

    private var prefs: SharedPreferences? = null
    var authToken: String? = null
        private set

    fun init(context: Context) {
        if (prefs == null) {
            prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
            authToken = prefs?.getString(KEY_ACCESS_TOKEN, null)
        }
    }

    fun saveSession(
        token: String,
        userId: Int,
        fullName: String,
        email: String?,
        phone: String?,
        firebaseUid: String?,
        photoUrl: String?
    ) {
        authToken = token
        prefs?.edit()?.apply {
            putString(KEY_ACCESS_TOKEN, token)
            putInt(KEY_USER_ID, userId)
            putString(KEY_FULL_NAME, fullName)
            putString(KEY_EMAIL, email)
            putString(KEY_PHONE, phone)
            putString(KEY_FIREBASE_UID, firebaseUid)
            putString(KEY_PHOTO_URL, photoUrl)
            apply()
        }
    }

    fun clearSession() {
        authToken = null
        prefs?.edit()?.clear()?.apply()
    }

    fun getStoredUserId(): Int = prefs?.getInt(KEY_USER_ID, 0) ?: 0
    fun getStoredFullName(): String? = prefs?.getString(KEY_FULL_NAME, null)
    fun getStoredEmail(): String? = prefs?.getString(KEY_EMAIL, null)
    fun getStoredPhone(): String? = prefs?.getString(KEY_PHONE, null)
    fun getStoredFirebaseUid(): String? = prefs?.getString(KEY_FIREBASE_UID, null)
    fun getStoredPhotoUrl(): String? = prefs?.getString(KEY_PHOTO_URL, null)
    fun hasValidSession(): Boolean = !authToken.isNullOrBlank()
}
