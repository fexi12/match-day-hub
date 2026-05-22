import { Shirt } from "lucide-react";
import jersey from "@/assets/ararat-porto-jersey.png";

export function Jerseys() {
  return (
    <section id="jerseys" className="bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm tracking-[0.3em]" style={{ color: "var(--color-ember)" }}>
          The Kit
        </p>
        <h2 className="mt-2 text-5xl md:text-6xl">Official Jerseys</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Forged in Porto, inspired by Ararat. The 2026 collection — bridge, mountain, river.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Home jersey */}
          <div className="border-2 border-primary rounded-xl bg-card overflow-hidden flex flex-col">
            <div className="flex items-center justify-center bg-[#f0e8d6] aspect-[4/5] p-6">
              <img
                src={jersey}
                alt="Ararat Porto 2026 home jersey"
                className="max-h-full max-w-full object-contain drop-shadow-2xl"
              />
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.25em] text-muted-foreground">HOME · 2026</p>
                <h3 className="mt-1 text-2xl">Bridge & Mountain</h3>
              </div>
              <span className="px-3 py-1 text-xs font-display tracking-wider bg-primary text-primary-foreground rounded">
                AVAILABLE
              </span>
            </div>
          </div>

          {/* Away jersey — WIP */}
          <div className="border-2 border-dashed border-border rounded-xl bg-card overflow-hidden flex flex-col">
            <div className="relative flex items-center justify-center aspect-[4/5] p-6 bg-[repeating-linear-gradient(45deg,_var(--color-border)_0,_var(--color-border)_1px,_transparent_1px,_transparent_14px)]">
              <Shirt className="h-32 w-32 text-muted-foreground/40" strokeWidth={1} />
              <span className="absolute top-4 right-4 px-3 py-1 text-[10px] font-display tracking-[0.25em] bg-accent text-accent-foreground rounded">
                WIP
              </span>
            </div>
            <div className="p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.25em] text-muted-foreground">AWAY · 2026</p>
                <h3 className="mt-1 text-2xl text-muted-foreground">Coming Soon</h3>
              </div>
              <span className="px-3 py-1 text-xs font-display tracking-wider border-2 border-border text-muted-foreground rounded">
                IN DESIGN
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
