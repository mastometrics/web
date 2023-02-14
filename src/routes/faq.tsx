import { fetchFromApi } from "../lib/mastodon/api";
import logo from "~/assets/logo.svg";
import footer from "~/assets/footer_festival.webp";
import { Page } from "~/components/Page";
import { ParentComponent } from "solid-js";

export default function HomeRoute() {
  return (
    <Page title="FAQ - MastoMetrics">
      <div class="rounded-lg border border-mastodon-purple-300/30 bg-white p-4 sm:p-8">
        <h1 class="text-4xl font-bold text-mastodon-purple-500">FAQ</h1>
        <p class="mt-4 max-w-prose  leading-relaxed text-gray-500">
          <strong class="font-semibold">MastoMetrics is a free and simple analytics app for Mastodon Accounts.</strong>{" "}
          Login using your Mastodon account and track the progress of your followers and see which of your posts perform
          well.
        </p>
      </div>
      <div class="my-8 columns-1  gap-4 space-y-2 sm:columns-2 sm:space-y-4">
        <FAQ title="Free?">
          <strong class="font-semibold text-mastodon-purple-500">Yes!</strong> The first version of MastoMetrics is
          absolutely free, no credit card required. I may add payed features in the future to support development, but
          you will always be able to use the free version.
        </FAQ>
        <FAQ title="Who made MastoMetrics?">
          MastoMetrics is made by{" "}
          <a href="https://mas.to/@robertvh" target="_blank" class="font-medium">
            @robertvh@mas.to
          </a>
          .
        </FAQ>
        <FAQ title="Why do I need to login with my Mastodon account?">
          Most data needed to track your account is available to the public (unless your posts are private), however
          apps and bots are limited in the amount of requests we can make to your instance. By logging in with your
          Mastodon account, we can make more requests on your behalf to get more accurate data.
          <br />
          <br />
          We don't have access to your email address or password, and don't need write access to your account.
        </FAQ>

        <FAQ title="How often is data updated?">
          Your account data is fetched once every hour. Graphs include daily data. After you sign up, we will fetch your
          last 40 posts and attempt to create historical data about your followers. From that moment on the number of
          followers gained and engagement on your posts will be tracked regurarly.
        </FAQ>
        <FAQ title="What data is stored?">
          We store your Mastodon account data, including your username, display name, avatar, and bio as well as all
          your posts, including the content, date, and number of likes and boosts.
          <br />
          In addition, we store the number of followers you have gained and the engagement on your posts over time to
          provide you with analytics.
        </FAQ>
        <FAQ title="Can I delete my account?">
          Yes, you can delete your account at any time. All your data will be deleted immediately. Mention
          @mastometrics@mas.to from your account to request deletion.
        </FAQ>
      </div>
    </Page>
  );
}

const FAQ: ParentComponent<{ title: string }> = (props) => (
  <div class="break-inside-avoid-column rounded-lg  bg-mastodon-purple-300/10 p-4 sm:p-8">
    <h2 class="text-xl font-bold text-mastodon-purple-500">{props.title}</h2>
    <p class="mt-4 max-w-prose leading-relaxed text-gray-500">{props.children}</p>
  </div>
);
