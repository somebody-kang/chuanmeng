import SiteNav from "@/components/SiteNav";
import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <>
      <SiteNav active="admin" />
      <AdminPanel />
    </>
  );
}
