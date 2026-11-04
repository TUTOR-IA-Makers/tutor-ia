import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/routes/not-found'
import { PublicLayout } from './layout/PublicLayout'
import { RootLayout } from './layout/RootLayout'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import('@/routes/landing')).LandingPage }),
      },
    ],
  },
  {
    lazy: async () => ({ Component: (await import('./layout/AuthLayout')).AuthLayout }),
    children: [
      {
        path: 'entrar',
        lazy: async () => ({ Component: (await import('@/routes/auth')).LoginPage }),
      },
      {
        path: 'criar-conta',
        lazy: async () => ({ Component: (await import('@/routes/auth')).SignupPage }),
      },
    ],
  },
  {
    element: <RootLayout />,
    children: [
      {
        path: 'biblioteca',
        lazy: async () => ({ Component: (await import('@/routes/library')).LibraryPage }),
      },
      {
        path: 'gerar',
        lazy: async () => ({ Component: (await import('@/routes/generate')).GeneratePage }),
      },
      {
        path: 'questoes/:id',
        lazy: async () => ({ Component: (await import('@/routes/question')).QuestionPage }),
      },
      {
        path: 'ajuda',
        lazy: async () => ({ Component: (await import('@/routes/help')).HelpPage }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
