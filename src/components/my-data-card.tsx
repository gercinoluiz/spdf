import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";

interface ClientInfo {
    title: string;
    desc?: any;
}

export default function MyDataCard(clientInfo: ClientInfo) {
    return (
         <Card className=' max-h-28'>
            <CardContent className='p-4 '>
       
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {clientInfo.title}
                </h3>
                
                <p className='text-sm text-gray-500'> {clientInfo.desc}</p>
              </div>
            </CardContent>
          </Card>
    );
    }