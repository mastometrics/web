import { fetchFromApi } from "../lib/mastodon/api";
import logo from "~/assets/logo.svg";
import footer from "~/assets/footer_festival.webp";
import { Page } from "~/components/Page";

export default function HomeRoute() {
  return (
    <Page title="MastoMetrics">
      <div class="my-8 text-center">
        <h1 class="text-4xl font-bold text-mastodon-purple-500">Soon!</h1>
        <h2 class="mt-4 text-xl font-medium text-mastodon-purple-800/80">
          The free Mastodon Analytics app is almost here
        </h2>
        <p class="mt-4 text-gray-500">
          Follow the development at{" "}
          <a href="https://mas.to/@mastometrics" target="_blank" class="font-medium">
            <span class="text-mastodon-purple-600">@mastometrics</span>@mas.to
          </a>
        </p>
        <figure class="mt-8">
          <img src={footer} />
          <figcaption class="mt-2 text-xs text-gray-500">&copy; Image from https://joinmastodon.org/apps</figcaption>
        </figure>
      </div>
    </Page>
  );
}
