import { AxiosError } from "axios";

import { useToast } from "@/components/ToastProvider";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import
{
  forgotPasswordService,
  getGoogleAuthUrlService,
  googleCallbackService,
  logoutService,
  setNewPasswordService,
  signInService,
  signUpService
} from "@/services/authService";
import { getUserProfileService } from "@/services/userService";
import { useUserStore } from "@/store/userStore";
import type {
  FORGOTPASSWORD_PAYLOAD,
  GOOGLE_CALLBACK_PAYLOAD,
  LOGIN_PAYLOAD,
  SETNEWPASSWORD_PAYLOAD,
  SIGNUP_PAYLOAD
} from "@/types/auth";
import { removeToken, setRefreshToken, setToken } from "@/utils/localStorage";

export const useauth = () =>
{
  const { showToast } = useToast();
  const { setUser } = useUserStore();

  const fetchUserProfile = async () =>
  {
    try
    {
      const res = await getUserProfileService();
      if (res && res.success && res.data)
      {
        setUser(res.data);
        return res.data;
      }
      return null;
    } catch (error)
    {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
  };

  const signIn = async (paylaod: LOGIN_PAYLOAD) =>
  {
    try
    {
      const res = await signInService(paylaod);

      if (res && res.success)
      {
        const accessToken =
          res.data?.accessToken ?? (res as { accessToken?: string; }).accessToken ?? (res as { access_token?: string; }).access_token;
        const refreshToken = res.data?.refreshToken;
        if (accessToken) setToken(accessToken);
        if (refreshToken) setRefreshToken(refreshToken);

        const userData = await fetchUserProfile();

        if (!userData && res.data?.user)
        {
          setUser(res.data.user);
        }

        showToast(res.message || "Successfully signed in", "success");
        return res;
      } else if (res && !res.success)
      {
        // Handle case where API returns success: false with 200 status
        showToast(res.message || "Invalid email or password", "error");
        throw new Error(res.message || "Login failed");
      }
    } catch (error: unknown)
    {
      if (error instanceof AxiosError)
      {
        showToast(getApiErrorMessage(error, "An error occurred during sign in"), "error");
      } else if (error instanceof Error)
      {
        showToast(error.message, "error");
      } else
      {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    }
  };

  const signUp = async (paylaod: SIGNUP_PAYLOAD) =>
  {
    try
    {
      const res = await signUpService(paylaod);
      if (res && res.success)
      {
        showToast(res.message || "Verification email has been sent to your email address.", "success");
        return res;
      }
    } catch (error: unknown)
    {
      if (error instanceof AxiosError)
      {
        showToast(getApiErrorMessage(error, "An error occurred during signup"), "error");
      } else
      {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    }
  };
  const forgotPassword = async (paylaod: FORGOTPASSWORD_PAYLOAD) =>
  {
    try
    {
      const res = await forgotPasswordService(paylaod);
      if (res && res.success)
      {
        showToast(res.message || "Password reset email has been sent.", "success");
        return res;
      } else if (res && !res.success)
      {
        showToast(res.message || "Failed to send reset email", "error");
        throw new Error(res.message || "Failed to send reset email");
      }
    } catch (error: unknown)
    {
      if (error instanceof AxiosError)
      {
        showToast(getApiErrorMessage(error, "An error occurred"), "error");
      } else if (error instanceof Error)
      {
        showToast(error.message, "error");
      } else
      {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    }
  };
  const setNewPassword = async (paylaod: SETNEWPASSWORD_PAYLOAD) =>
  {
    try
    {
      const res = await setNewPasswordService(paylaod);
      if (res && res.success)
      {
        showToast(res.message || "Password has been reset successfully", "success");
        return res;
      } else if (res && !res.success)
      {
        showToast(res.message || "Failed to reset password", "error");
        throw new Error(res.message || "Failed to reset password");
      }
    } catch (error: unknown)
    {
      if (error instanceof AxiosError)
      {
        showToast(getApiErrorMessage(error, "An error occurred"), "error");
      } else if (error instanceof Error)
      {
        showToast(error.message, "error");
      } else
      {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    }
  };
  const getGoogleAuthUrl = async () =>
  {
    try
    {
      const res = await getGoogleAuthUrlService();
      if (res && res.success && res.data?.url)
      {
        // Redirect to Google OAuth URL
        window.location.href = res.data.url;
      } else
      {
        showToast("Failed to initiate Google authentication", "error");
      }
    } catch (error: unknown)
    {
      if (error instanceof AxiosError)
      {
        showToast(getApiErrorMessage(error, "An error occurred"), "error");
      } else
      {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      throw error;
    }
  };

  const handleGoogleCallback = async (code: string) =>
  {
    try
    {
      const payload: GOOGLE_CALLBACK_PAYLOAD = { token: code };
      const res = await googleCallbackService(payload);
      if (res && res.success)
      {
        const accessToken = res.data?.accessToken;
        const refreshToken = res.data?.refreshToken;
        if (accessToken) setToken(accessToken);
        if (refreshToken) setRefreshToken(refreshToken);

        const userData = await fetchUserProfile();

        if (!userData && res.data?.user)
        {
          setUser(res.data.user);
        }

        showToast(res.message || "Successfully signed in with Google", "success");
        return res;
      } else if (res && !res.success)
      {
        // Display the actual API error message
        const errorMsg = res.message || "Google authentication failed";
        showToast(errorMsg, "error");
        throw new Error(errorMsg);
      }
    } catch (error: unknown)
    {
      if (error instanceof AxiosError)
      {
        showToast(getApiErrorMessage(error, "An error occurred during Google authentication"), "error");
      } else if (error instanceof Error)
      {
        showToast(error.message, "error");
      } else
      {
        showToast("An unexpected error occurred. Please try again.", "error");
      }
      return null;
    }
  };

  const logout = async (suppressToast = false) =>
  {
    try
    {
      await logoutService();
    } catch (error)
    {
      if (error instanceof AxiosError)
      {
        const status = error.response?.status;
        if (status === 404)
        {
        } else
        {
          console.error("Logout error:", error);
        }
      } else
      {
        console.error("Logout error:", error);
      }
    } finally
    {
      setUser(null);
      removeToken();

      if (!suppressToast)
      {
        showToast("Successfully signed out", "success");
      }
      window.location.href = "/login";
    }
  };

  return {
    signIn,
    signUp,
    forgotPassword,
    setNewPassword,
    getGoogleAuthUrl,
    handleGoogleCallback,
    logout,
    fetchUserProfile
  };
};
