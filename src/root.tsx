// @refresh reload
import { createEffect, createSignal, onMount, Suspense } from "solid-js";
import { NoHydration } from "solid-js/web";
import { Body, ErrorBoundary, FileRoutes, Head, Html, Meta, Routes, Scripts, Title } from "solid-start";
import { createPrefersDark } from "@solid-primitives/media";
import "./root.css";
import { createStorageSignal } from "@solid-primitives/storage";
import { createContextProvider } from "@solid-primitives/context";
import { Box } from "./components/Box";

export type Theme = "dark" | "light" | "system";
const [ThemeProvider, useTheme] = createContextProvider(() => {
  const [theme, setTheme] = createStorageSignal<Theme>("theme", "system");
  const prefersDark = createPrefersDark();

  createEffect(() => {
    if (theme() == "dark" || (theme() != "light" && prefersDark())) document.documentElement.classList.add("dark");
    else if (theme() === "light" || (theme() != "dark" && !prefersDark()))
      document.documentElement.classList.remove("dark");
  });

  return { theme, setTheme };
});

const blockingThemeScript = `
if (localStorage.theme === "dark" || (localStorage.theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches))
  document.documentElement.classList.add("dark");
else document.documentElement.classList.remove("dark");
`;

export { useTheme };

export default function Root() {
  const isAppMode = import.meta.env.VITE_DEPLOYMENT_TYPE != "worker";
  return (
    <Html lang="en">
      <Head>
        <Title>MastoMetrics</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="theme-color" content="#2A2AA8" />
        <Meta
          name="description"
          content="Analytics for Mastodon. Track the growth and success of your Mastodon account and posts."
        />
        <Meta name="twitter:card" content="summary" />
        <Meta name="twitter:site" content="@MastoMetrics" />
        <Meta name="twitter:creator" content="@MastoMetrics" />
        <Meta name="twitter:title" content="MastoMetrics" />
        <Meta
          name="twitter:description"
          content="Analytics for Mastodon. Track the growth and success of your Mastodon account and posts."
        />
        <Meta name="twitter:image" content="https://mastometrics.com/og-image.png" />
        <Meta property="og:type" content="website" />
        <Meta property="og:title" content="MastoMetrics" />
        <Meta
          property="og:description"
          content="Analytics for Mastodon. Track the growth and success of your Mastodon account and posts."
        />
        <Meta property="og:site_name" content="MastoMetrics" />
        <Meta property="og:url" content="https://mastometrics.com" />
        <Meta property="og:image" content="https://mastometrics.com/og-image.png" />
        <Meta property="og:image:width" content="1200" />
        <Meta property="og:image:height" content="630" />
        <Meta property="og:image:alt" content="MastoMetrics" />
        <Meta property="og:locale" content="en_US" />
      </Head>
      <Body class="bg-mastodon-purple-200/10 dark:bg-[#080822] dark:text-white">
        <ThemeProvider>
          <ErrorBoundary>
            {isAppMode ? (
              <Suspense fallback={<div>Loading</div>}>
                <Routes>
                  <FileRoutes />
                </Routes>
              </Suspense>
            ) : (
              <Box title="Cannot render app in worker mode" />
            )}
          </ErrorBoundary>
        </ThemeProvider>
        <Scripts />
        <NoHydration>
          <script type="text/javascript">{blockingThemeScript}</script>
        </NoHydration>
      </Body>
    </Html>
  );
}
