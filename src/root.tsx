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
        <Meta name="twitter:image" content="https://mastometrics.com/public/og-image.png" />
        <Meta property="og:type" content="website" />
        <Meta property="og:title" content="MastoMetrics" />
        <Meta
          property="og:description"
          content="Analytics for Mastodon. Track the growth and success of your Mastodon account and posts."
        />
        <Meta property="og:site_name" content="MastoMetrics" />
        <Meta property="og:url" content="https://mastometrics.com" />
        <Meta property="og:image" content="https://mastometrics.com/public/og-image.png" />
        <Meta property="og:image:width" content="1200" />
        <Meta property="og:image:height" content="630" />
        <Meta property="og:image:alt" content="MastoMetrics" />
        <Meta property="og:locale" content="en_US" />
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
