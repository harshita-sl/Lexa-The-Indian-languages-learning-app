import { Loader } from "lucide-react";

const Loading = () => {
    return (
        <div className="h-full flex items-center justify-center">       
            <Loader className="animate-spin h-6 w-6 text-muted-foreground"/>
        </div>
    );
}

export default Loading;