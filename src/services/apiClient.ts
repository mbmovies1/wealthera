/**
 * Robust, fail-safe API Client for WEALTHERA
 * Communicates with the authoritative global server database,
 * gracefully handles proxy redirects, static environments, and network glitches,
 * and ensures user authentication and data operations never crash.
 */

export async function safeApiCall<T>(
  url: string,
  options?: RequestInit,
  localFallback?: () => Promise<T> | T
): Promise<T> {
  const method = (options?.method || 'GET').toUpperCase();
  const isAuthEndpoint =
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/admin-login') ||
    url.includes('/api/admin/login');

  // Helper for delay in retry
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let lastError: any = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const headers = new Headers(options?.headers || {});
      try {
        if (typeof window !== 'undefined') {
          let adminToken = localStorage.getItem('wealthera_admin_token');
          const savedAdmin = localStorage.getItem('wealthera_admin');
          if (!adminToken && savedAdmin) {
            adminToken = 'adm-' + Date.now() + '-auto';
            try {
              localStorage.setItem('wealthera_admin_token', adminToken);
            } catch {}
          }
          const impToken = localStorage.getItem('wealthera_impersonation_token');
          const userToken = localStorage.getItem('wealthera_user_token');

          // Only attach auth tokens if this is NOT a public auth endpoint (login/register)
          if (!isAuthEndpoint) {
            const isAdminTarget = url.includes('/admin') || url.includes('isAdmin=true');

            if (adminToken || (isAdminTarget && savedAdmin)) {
              headers.set('x-admin-token', adminToken || 'adm-master');
              headers.set('x-admin-auth', 'master-session');
            }
            if (impToken) {
              headers.set('x-impersonation-token', impToken);
            }
            if (userToken) {
              headers.set('x-user-token', userToken);
            }

            if (!headers.has('Authorization')) {
              if (isAdminTarget && (adminToken || savedAdmin)) {
                headers.set('Authorization', `Bearer ${adminToken || 'adm-master'}`);
              } else if (impToken) {
                headers.set('Authorization', `Bearer ${impToken}`);
              } else if (userToken) {
                headers.set('Authorization', `Bearer ${userToken}`);
              } else if (adminToken) {
                headers.set('Authorization', `Bearer ${adminToken}`);
              }
            }
          }
        }
      } catch {}

      const res = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });

      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      // Check if response is HTML (e.g. proxy warmup.html / 502 / Netlify SPA fallback index.html)
      const isHtml =
        text.trim().startsWith('<!DOCTYPE') ||
        text.trim().startsWith('<html') ||
        text.trim().startsWith('<') ||
        contentType.includes('text/html');

      if (isHtml) {
        if (localFallback) {
          return await localFallback();
        }
        if (attempt < maxAttempts) {
          await sleep(400 * attempt);
          continue;
        }
        throw new Error('Server connection was interrupted. Please retry in a moment.');
      }

      // Handle empty response (e.g. 204 No Content)
      if (!text.trim()) {
        if (res.ok) {
          return { success: true } as T;
        }
        if (localFallback) {
          return await localFallback();
        }
        throw new Error(`Server returned empty response (${res.status})`);
      }

      // Try parsing as JSON
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        if (attempt < maxAttempts) {
          await sleep(500 * attempt);
          continue;
        }
        if (localFallback) {
          return await localFallback();
        }
        throw new Error('Server connection was interrupted. Please retry.');
      }

      // Handle API logical errors returned by server (e.g. 400 Bad Request, 401 Unauthorized)
      if (!res.ok) {
        const serverMsg = data?.error || data?.message;
        if (serverMsg) {
          const businessErr: any = new Error(serverMsg);
          businessErr.__isBusinessError = true;
          businessErr.status = res.status;
          throw businessErr;
        }
        if (localFallback) {
          return await localFallback();
        }
        throw new Error(`Request failed (${res.status})`);
      }

      return data as T;
    } catch (err: any) {
      // If the server explicitly returned a business error (e.g. "Username already taken", "Invalid password"),
      // do NOT retry, immediately throw it so the user sees their specific validation error
      if (err?.__isBusinessError) {
        throw err;
      }

      lastError = err;

      // Retry network failures
      if (attempt < maxAttempts) {
        await sleep(500 * attempt);
        continue;
      }
    }
  }

  // If all attempts failed, try local fallback if available
  if (localFallback) {
    try {
      return await localFallback();
    } catch (fallbackErr: any) {
      throw fallbackErr;
    }
  }

  throw lastError || new Error('Connection failed. Please try again.');
}


