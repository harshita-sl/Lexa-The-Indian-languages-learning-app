import { Sidebar } from "@/components/sidebar";
type Props = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: Props) => {
  return (
    <>
        <Sidebar />
    <main className="pl-[256px] h-full">
        <div className="bg-blue-500 h-full">

        {children}
        </div>
    </main>
    </>
  );
};
export default MainLayout;