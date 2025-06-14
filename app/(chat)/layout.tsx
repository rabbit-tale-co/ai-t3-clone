import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { getSidebarThreadsByUserId } from '@/lib/db/queries';

export const experimental_ppr = true;

async function getInitialData(userId: string) {
  try {
    const result = await getSidebarThreadsByUserId({
      userId,
      limit: 50, // Limit dla SSR
      startingAfter: null,
      endingBefore: null,
    });

    return {
      threads: result.threads,
      folders: result.folders,
      tags: result.tags,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return {
      threads: [],
      folders: [],
      tags: [],
      hasMore: false,
    };
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();

  // Pobierz stan sidebara z cookies, domyślnie true
  const sidebarState = cookieStore.get('sidebar_state');
  const defaultOpen = sidebarState ? sidebarState.value === 'true' : true;

  // Pobierz początkowe dane tylko dla zalogowanych użytkowników
  const initialData = session?.user?.id
    ? await getInitialData(session.user.id)
    : { threads: [], folders: [], tags: [], hasMore: false };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar session={session} initialData={initialData} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
