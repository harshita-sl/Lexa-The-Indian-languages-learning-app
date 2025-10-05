import { Button } from "@/components/ui/button";
import Image from "next/image";
export const Footer = () => {
  return (
    <footer className="hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2">
      <div className="max-w-screen-lg mx-auto flex items-center justify-evenly h-full">
      <Button size="lg" variant="ghost" className="w-40" >
        <Image
          src="/tel.svg"
          alt="telugu"
          height={32}
          width={40}
          className="mr-4 rounded-md "
          />
          Telugu
      </Button>
      <Button size="lg" variant="ghost" className="w-40" >
        <Image
          src="/kannada.svg"
          alt="kannada"
          height={32}
          width={40}
          className="mr-4 rounded-md "
          />
          Kannada
      </Button>
      <Button size="lg" variant="ghost" className="w-40" >
        <Image
          src="/hindi.svg"
          alt="hindi"
          height={32}
          width={40}
          className="mr-4 rounded-md "
          />
          Hindi
      </Button>
      <Button size="lg" variant="ghost" className="w-40" >
        <Image
          src="/om.svg"
          alt="sanskrit"
          height={32}
          width={40}
          className="mr-4 rounded-md "
          />
          Sanskrit
      </Button>
      </div>
    
    </footer>
  );
};