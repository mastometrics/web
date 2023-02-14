import { fetchFromApi } from "../lib/mastodon/api";
import logo from "~/assets/logo.svg";
import footer from "~/assets/footer_festival.webp";
import { Page } from "~/components/Page";

export default function HomeRoute() {
  return (
    <Page title="MastoMetrics">
      <div class="text-center">
        <h1 class="text-4xl text-mastodon-purple-500 font-bold">Soon!</h1>
        <h2 class="text-xl mt-4 text-mastodon-purple-800/80 font-medium">
          The free Mastodon Analytics app is almost here
        </h2>
        <p class="text-gray-500 mt-4">
          Follow the development at{" "}
          <a href="https://mas.to/@mastometrics" target="_blank" class="font-medium">
            <span class="text-mastodon-purple-600">@mastometrics</span>@mas.to
          </a>
        </p>
        <figure class="mt-8">
          <img src={footer} />
          <figcaption class="text-gray-500 text-xs mt-2">&copy; Image from https://joinmastodon.org/apps</figcaption>
        </figure>
      </div>
    </Page>
  );
}
