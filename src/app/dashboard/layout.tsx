import { Header } from '@/components/layout/header';
import { AppLayout } from '@/components/layout/app-layout';
import { MainSidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout sidebar={<MainSidebar />}>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 sm:p-6 bg-muted/30">{children}</main>
      </div>
    </AppLayout>
  );
}
