import { Navigate, type RouteObject } from 'react-router'
import { NotFoundPage } from '@/routes/not-found'
import { RootLayout } from './layout/RootLayout'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/biblioteca" replace /> },
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
