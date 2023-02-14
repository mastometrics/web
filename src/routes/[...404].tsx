import { Page } from "~/components/Page";

export default function NotFound() {
  return (
    <Page title="404 Page Not Found">
      <div class="text-center">
        <h1 class="text-4xl text-mastodon-purple-500 font-bold">404</h1>
        <h2 class="text-xl mt-4 text-mastodon-purple-800/80 font-medium">Page Not Found</h2>
      </div>
    </Page>
  );
}
