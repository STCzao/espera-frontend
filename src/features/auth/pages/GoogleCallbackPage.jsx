import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/authApi.js'
import { usePostLoginRedirect } from '../hooks/usePostLoginRedirect.js'
import { getLoginErrorMessage } from '../model/loginErrorMessages.js'
import { LoginVisualScene } from '../components/LoginVisualScene.jsx'

export function GoogleCallbackPage() {
  const shouldReduceMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const redirectAfterLogin = usePostLoginRedirect()

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const providerError = searchParams.get('error')

  const loginQuery = useQuery({
    queryKey: ['google-login', code, state],
    queryFn: () => authApi.loginWithGoogle({ code, state }),
    enabled: Boolean(code) && Boolean(state) && !providerError,
    retry: false,
  })

  useEffect(() => {
    if (loginQuery.isSuccess) {
      redirectAfterLogin()
    }
    // redirectAfterLogin fetches its own fresh session/business state; only its
    // trigger (a successful code exchange) belongs in this effect's deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginQuery.isSuccess])

  const errorMessage = providerError
    ? 'Cancelaste la conexión con Google.'
    : !code || !state
      ? 'El enlace de Google es inválido o incompleto.'
      : loginQuery.isError
        ? getLoginErrorMessage(loginQuery.error)
        : null

  return (
    <LoginVisualScene reduceMotion={shouldReduceMotion}>
      <motion.section
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        className="w-full max-w-[480px] rounded-lg border border-white/18 bg-[#fdf9ff] p-7 text-center text-espera-text shadow-[0_18px_60px_rgba(0,0,0,0.20)] sm:p-8"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {errorMessage ? (
          <>
            <h1 className="m-0 text-2xl font-black uppercase tracking-[-0.03em] text-espera-text">
              No pudimos conectarte
            </h1>
            <p className="mt-4 text-espera-text-muted" role="alert">
              {errorMessage}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-espera-purple px-4 font-semibold text-white" to="/login">
                Volver a iniciar sesión
              </Link>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-espera-purple" size={32} aria-hidden="true" />
            <p className="mt-4 text-espera-text-muted" role="status">
              Conectando con Google…
            </p>
          </>
        )}
      </motion.section>
    </LoginVisualScene>
  )
}
