import { children, Component, createEffect, createSignal, For, onCleanup, onMount, ParentComponent } from "solid-js";
import { Meta, Title } from "solid-start";
import { A } from "@solidjs/router";
import graphBgPattern from "~/assets/graph-bg.svg";
import screenshotDark from "~/assets/screenshot-dark.png";
import Logo3d from "~/assets/3d-logo.svg";
import logo from "~/assets/logo.svg";
import { vendorIcons } from "~/assets/icons";

export default function HomeRoute() {
  // onMount(() => window.document.querySelector("html")?.classList.add("dark"));

  return (
    <div class="relative min-h-screen bg-[#0B0C32] font-display">
      <Title>MastoMetrics - Analytics for Mastodon</Title>
      <Meta name="description" content="Track the growth of your Mastodon Account" />
      <BackgroundPattern />

      <div class="container relative mx-auto min-h-screen max-w-4xl 2xl:max-w-6xl">
        <Nav />
        <Hero slogan="Track the growth of your Mastodon Account" />
        <Features>
          <Feature title="Free">MastoMetrics is free to use for any number of accounts.</Feature>
          <Feature title="Simple">Track follower progress over time and see your most engaging posts.</Feature>
          <Feature title="Fair">We don’t need your email and don’t store hidden accounts.</Feature>
        </Features>
        <SignUp
          // cta="Enter your Mastodon username to get started"
          // guarantees={["No email required.", "No write permissions asked."]}
          cta="Sign up soon"
          guarantees={["No email required.", "No write permissions asked."]}
        />
        <FooterNav>
          <a href="/faq">FAQ</a>
          {/* <a href="/privacy">Privacy</a>
          <a href="/roadmap">Roadmap</a> */}
          <a href="https://mas.to/@MastoMetrics">Contact</a>
          <a rel="me" href="https://mas.to/@MastoMetrics">
            @mastometrics@mas.to
          </a>
        </FooterNav>
        <FooterCredits />
      </div>
    </div>
  );
}

const Nav: Component = () => {
  return (
    <div class="z-10 flex h-20 flex-row items-center justify-center px-4 sm:px-8">
      <div class="relative flex items-center">
        <img src={logo} alt="MastoMetrics logo" class="mr-2 h-10 w-14 object-cover object-left" />
        {/* <img src={logo} alt="MastoMetrics logo" class="absolute left-0 h-10 opacity-50" /> */}
        <div class="flex flex-col gap-x-3 sm:flex-row sm:items-center">
          <p class="text-base font-extrabold text-white sm:text-2xl">MastoMetrics</p>
          <p class="-mt-0.5 text-xs font-semibold text-mastodon-purple-200/80 sm:mt-1 sm:text-lg">
            Analytics for Mastodon
          </p>
        </div>
      </div>
      <div class="flex-auto"></div>
      <div class="">
        {/* <button
          class={`rounded-lg border border-mastodon-purple-400 bg-gradient-to-b from-mastodon-purple-600/10 to-mastodon-purple-800/50
        px-6 py-2 font-semibold text-mastodon-purple-100 shadow-[0_1px_4px_1px_rgba(0,0,0,0.09),inset_0_1px_2px_0_rgba(0,0,0,0.18)]
        transition-all duration-75 hover:border-mastodon-purple-300 hover:from-mastodon-purple-600/40 hover:to-mastodon-purple-700/70
        hover:shadow-[0_1px_7px_2px_rgba(0,0,0,0.1),inset_0_1px_2px_0_rgba(0,0,0,0.18)] focus:outline-none 
        focus-visible:border-mastodon-purple-100 active:from-mastodon-purple-700/20 active:to-mastodon-purple-900/40 active:shadow-none active:duration-0
        `}
        >
          Login
        </button> */}
      </div>
    </div>
  );
};

const Hero: Component<{ slogan: string }> = (props) => {
  return (
    <div class="flex flex-col-reverse items-center justify-center px-4 sm:px-8">
      <div class="-mt-20 flex flex-col items-center justify-center sm:-mt-32">
        <div class="z-20 -my-3">
          <img src={Logo3d} class="w-40 sm:w-60" alt="" />
        </div>
        <div class="text-center text-2xl font-extrabold text-white sm:text-4xl">MastoMetrics</div>
        <div class="mt-2 text-center text-base font-medium text-mastodon-purple-200 sm:text-2xl">{props.slogan}</div>
      </div>
      <div class="aspect-video w-full rounded-sm bg-black shadow-2xl">
        <img
          src={screenshotDark}
          class="aspect-[4/5] w-full object-cover object-top sm:aspect-[4/3]"
          alt="Screenshot of MastoMetrics Dashboard"
        />
      </div>
    </div>
  );
};

const Features: ParentComponent = (props) => (
  <div class="my-24 grid gap-6 px-4 sm:px-8 lg:grid-cols-3">{props.children}</div>
);

const Feature: ParentComponent<{ title: string }> = (props) => {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [pos, setPos] = createSignal({ x: 0, y: 0 });
  const [relativePos, setRelativePos] = createSignal({ x: 0, y: 0 });

  onMount(() => {
    const ctrl = new AbortController();
    const el = container()!;
    el?.addEventListener(
      "mousemove",
      (e) => {
        // calculate the cursor position within the container based on the clientX and clientY
        const rect = el.getBoundingClientRect(),
          x = e.clientX - rect.left,
          y = e.clientY - rect.top;
        setPos({ x, y });
        // setPos({ x: e.offsetX, y: e.offsetY });
        // set text shadow with y and x offset based on the cursor position within the container
        // where 0,0 is the center of the container and 1,1 is the bottom right corner
        const xOffset = x / container()!.offsetWidth - 0.5;
        const yOffset = y / container()!.offsetHeight - 0.5;
        setRelativePos({ x: xOffset, y: yOffset });
      },
      {
        passive: true,
        signal: ctrl.signal,
      }
    );
    onCleanup(() => ctrl.abort());
  });
  return (
    <div
      ref={setContainer}
      class="overflow- group relative rounded-xl border-[#1B1C69] bg-[#080821]/70 p-6 shadow-[0_1px_0_1px_rgba(165,144,255,0.25),inset_0_1px_0_1px_rgba(67,46,160,0.73)] sm:p-8"
    >
      <div
        class="pointer-events-none absolute inset-0 hidden rounded-[inherit] p-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-80 sm:block"
        style={{
          "background-image": `radial-gradient(circle at ${pos().x}px ${
            pos().y
          }px, rgba(94,85,236,0.31) 0%, rgba(14,15,59,0.00) 80%)`,
          "box-shadow": `${relativePos().x * -5}px ${relativePos().y * -5 + 10}px 15px 2px rgba(0,0,0,0.2)`,
        }}
      >
        <div
          class="text-base font-extrabold text-white/0"
          style={{ "text-shadow": `${relativePos().x * -10}px ${relativePos().y * -10}px 4px rgba(0,0,0,0.5)` }}
        >
          {props.title}
        </div>
        <div
          class="mt-4 text-base font-medium leading-normal text-mastodon-purple-200/0"
          style={{ "text-shadow": `${relativePos().x * -10}px ${relativePos().y * -10}px 4px rgba(0,0,0,0.5)` }}
        >
          {props.children}
        </div>
      </div>
      <div class="relative text-base font-extrabold text-white">{props.title}</div>
      <div class="relative mt-4 text-base font-medium leading-normal text-mastodon-purple-200">{props.children}</div>
    </div>
  );
};

const BackgroundPattern = () => {
  const mask = `linear-gradient(90deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.00) 2%, rgba(0,0,0,0.94) 20%, #000000 25%, #000000 75%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.00) 98%, rgba(0,0,0,0.00) 100%)`;
  return (
    <>
      <div class="absolute top-0 mx-auto h-screen w-full overflow-hidden" aria-hidden="true">
        <div class="top-0 z-0 mx-auto aspect-[2/1] w-full max-w-[120rem] origin-top scale-125  bg-[radial-gradient(farthest-side_at_top,_var(--tw-gradient-stops))] from-[#4A4DED]  to-[#0B0C32]"></div>
      </div>
      <div class="absolute mx-auto h-full w-full overflow-hidden" aria-hidden="true">
        <div class="absolute  top-[150vw]  left-[-20%] right-[-50%] z-0   w-[200%] overflow-x-clip sm:top-[45rem] lg:top-[55rem] lg:-left-4 lg:-right-4  lg:h-[60rem] lg:w-full 2xl:top-[62rem]">
          <img
            src={graphBgPattern}
            class="mx-auto"
            style={{ "-mask-image": mask, "-webkit-mask-image": mask }}
            alt=""
          />
        </div>
      </div>
    </>
  );
};

const SignUp: Component<{ cta: string; guarantees: string[] }> = (props) => {
  return (
    <div class="my-24 flex flex-col items-center justify-center px-4 sm:px-8">
      <div class="text-lg font-bold text-white">{props.cta}</div>
      <div class="mt-2 flex flex-wrap gap-2 text-base font-medium text-mastodon-purple-200">
        <For each={props.guarantees}>{(g) => <p>{g}</p>}</For>
        <A href="/faq" class="text-mastodon-purple-400 transition hover:text-white">
          Learn more →
        </A>
      </div>
      {/* <div class="mt-6 flex flex-col items-center justify-center">
        <button class="rounded bg-black/50 px-4 py-2 font-semibold text-white">Sign up</button>
      </div> */}
    </div>
  );
};

const FooterNav: ParentComponent = (props) => {
  const c = children(() => props.children);
  createEffect(() =>
    c.toArray().forEach((link) => {
      const a = link as HTMLAnchorElement;
      a.classList.add("text-mastodon-purple-400", "transition", "hover:text-white");
      if (a.href.startsWith("https://")) a.target = "_blank";
    })
  );

  return (
    <div class="mt-24 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-6 sm:gap-x-14 sm:px-8">
      {c()}
    </div>
  );
};

const FooterCredits: Component = () => {
  return (
    <div class="flex flex-wrap items-center justify-center gap-2 pt-4 pb-10 text-sm text-mastodon-purple-200/80  sm:text-base">
      <p>
        <span class="mr-1 inline-block text-white">🇳🇱</span> Made by{" "}
        <a
          class="transition hover:text-mastodon-purple-100"
          href="https://mas.to/@robertvh"
          target="_blank"
          rel="noopener"
        >
          @robertvh
        </a>{" "}
        in Amsterdam using
      </p>
      <a class="transition hover:text-mastodon-purple-100" href="https://solidjs.com" target="_blank" rel="noopener">
        <img class="mx-0.5 mb-0.5 inline-block w-4 align-middle" src={vendorIcons.solidjs} /> SolidJS + SolidStart,
      </a>
      <a
        class="transition hover:text-mastodon-purple-100"
        href="https://tailwindcss.com"
        target="_blank"
        rel="noopener"
      >
        <img class="mx-0.5 mb-0.5 inline-block w-4 align-middle" src={vendorIcons.tailwind} /> Tailwindcss,
      </a>
      <a class="transition hover:text-mastodon-purple-100" href="https://prisma.io" target="_blank" rel="noopener">
        <img class="mx-0.5 mb-0.5 inline-block w-4 align-middle" src={vendorIcons.prismaOnDark} /> Prisma,
      </a>
      <a class="transition hover:text-mastodon-purple-100" href="https://vitejs.dev" target="_blank" rel="noopener">
        <img class="mx-0.5 mb-0.5 inline-block w-4 align-middle" src={vendorIcons.vite} /> Vite
      </a>
      <p>
        and hosted on{" "}
        <a class="transition hover:text-mastodon-purple-100" href="https://railway.app/" target="_blank" rel="noopener">
          <img class="mx-0.5 mb-0.5 inline-block w-4 align-middle" src={vendorIcons.railwayOnDark} /> Railway
        </a>
      </p>
    </div>
  );
};
