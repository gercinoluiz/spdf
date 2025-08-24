import Link from "next/link"
import { Button } from "./ui/button"

export function Footer() {
  return (
    <footer className="border-t bg-slate-100 fixed bottom-0 w-full">
      <div className=" flex flex-row w-full bg-black font-medium text-white">
        <div className="flex flex-col items-center w-full gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center ml-4 text-sm leading-loose  md:text-left font-medium text-white">
            Built by{" PRODAM "}
            <Link
              href="/"
              className="font-medium underline underline-offset-4"
            >
            
            </Link>
            {/* . The source code is available on{" "}
            <Link
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </Link>
            . */}
          </p>
        </div>
        <div className="flex items-center  gap-4 ml-auto mr-0 ">
          <Button variant="ghost" size="sm">
            <Link href="/terms">Terms</Link>
          </Button>
          <Button variant="ghost" size="sm">
            <Link href="/privacy">Privacy</Link>
          </Button>
        </div>
      </div>
    </footer>
  )
}
