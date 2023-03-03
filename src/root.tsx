// @refresh reload
import { createSignal, Suspense } from "solid-js";
import { Body, ErrorBoundary, FileRoutes, Head, Html, Meta, Routes, Scripts, Title } from "solid-start";
import "./root.css";

export default function Root() {
  const [isDark, setIsDark] = createSignal(false);
  return (
    <Html lang="en" class={isDark() ? "dark" : ""}>
      <Head>
        <Title>MastoMetrics</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Body class="bg-mastodon-purple-200/10 dark:bg-[#080822] dark:text-white">
        <ErrorBoundary>
          <Suspense fallback={<div>Loading</div>}>
            <Routes>
              <FileRoutes />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </Body>
    </Html>
  );
}
