import { Page } from "~/components/Page";
import { ParentComponent } from "solid-js";
import { Box } from "~/components/Box";
import { A } from "solid-start";

export default function HomeRoute() {
  return (
    <Page title="FAQ - MastoMetrics">
      {/* <div class="rounded-lg border border-mastodon-purple-300/30 bg-white p-4 dark:bg-mastodon-purple-800 sm:p-8">
        <h1 class="text-4xl font-bold text-mastodon-purple-500">FAQ</h1>
        <p class="mt-4 max-w-prose  leading-relaxed text-gray-500 dark:text-white">
          <strong class="font-semibold">MastoMetrics is a free and simple analytics app for Mastodon Accounts.</strong>{" "}
          Login using your Mastodon account and track the progression of your follower count and see which of your posts
          perform well.
        </p>
      </div> */}
      <Box>
        <h1 class="text-4xl font-bold text-mastodon-purple-500">FAQ</h1>
        <p class="mt-4 max-w-prose  leading-relaxed text-gray-500 dark:text-white">
          <strong class="font-semibold">MastoMetrics is a free and simple analytics app for Mastodon Accounts.</strong>{" "}
          Login using your Mastodon account and track the progression of your follower count and see which of your posts
          perform well.
        </p>
      </Box>
      <div class="my-8 columns-1  gap-4 space-y-2 sm:columns-2 sm:space-y-4">
        <FAQ title="Free?">
          <strong class="font-semibold text-mastodon-purple-500 dark:text-mastodon-purple-300">Yes!</strong> The first
          version of MastoMetrics is absolutely free, no credit card required. I might add payed features in the future
          to support development, but you will always be able to use a generous free version.
        </FAQ>
        <FAQ title="Why would I use MastoMetrics?">
          Currently Mastodon does not offer useful analytics for your account. The Mastodon developers are,
          understandably so, hesistant to adding analytics or engagement-metric focused features into the core
          experience, as it may negatively influence the Mastodon athmosphere.
          <br />
          <br />
          MastoMetrics is an opt-in analytics tool for those interested in getting a better understanding of their
          community. MastoMetrics provides a unique view on your posts, so you can learn what resonates with your
          community.
        </FAQ>
        <FAQ title="Who made MastoMetrics?">
          MastoMetrics is made by{" "}
          <a href="https://mas.to/@robertvh" target="_blank" class="font-medium underline">
            @robertvh@mas.to
          </a>
          .
        </FAQ>
        <FAQ title="Why do I need to login with my Mastodon account?">
          Most data needed to track your account is available to the public (unless your posts are private), however
          apps and bots are limited in the amount of requests we can make to your instance. By logging in with your
          Mastodon account, we can make API requests on your behalf to get more accurate data.
          <br />
          <br />
          We don't have access to your email address or password, and don't need write access to your account.
        </FAQ>

        <FAQ title="How often is data updated?">
          Your account data is fetched once every hour and our graphs show daily numbers. After you sign up, we will
          fetch your last 2000 posts and attempt to create historical data about your followers. From that moment on the
          number of followers gained and engagement on your posts will be tracked regurarly. We only track and update
          the engagement on your last 120 posts.
        </FAQ>
        <FAQ title="What data is stored?">
          We store your public Mastodon account data, including your username, display name, avatar, and bio as well as
          all your posts, including the content, date, and number of likes and boosts.
          <br />
          In addition, we store the number of followers you have gained and the engagement on your posts over time to
          provide you with analytics.
          <br />
          We don't store any Direct Messages. "Follower Only" posts <em>are</em> stored. <br />
          <br />
          <A href="/privacy" class="font-medium underline">
            Read our privacy policy
          </A>
        </FAQ>
        <FAQ title="Can I delete my account?">
          Yes, you can delete your account at any time via your account settings. All your data will be deleted
          immediately. You can alternatively revoke access to MastoMetrics App from your Mastodon account settings,
          after which we will delete your data if you don't sign in again within 30 days.
        </FAQ>
        <FAQ title="Is this open source? Can I self-host or contribute?">
          For now, MastoMetrics is not open source. I might open source it in the future, but for now I want to keep
          control over the development and performance while keeping options open to add payed features to fund
          development. If you're interested in contributing, auditing the source code or self-hosting, please let{" "}
          <a href="https://mas.to/@mastometrics" target="_blank" class="font-medium underline">
            me
          </a>{" "}
          know.
        </FAQ>
        <FAQ title="What features are planned?">
          I have a lot of ideas for new features, but I'm not sure which ones to prioritize. In general I'm interested
          in either broading the scope of MastoMetrics to include more Mastodon features like digests, post scheduling
          and interacting with your followers, or making MastoMetrics more intelligent by analyzing your posts and
          providing insight into what works and what doesn't.
          <br />
          <br />
          Make sure to let{" "}
          <a href="https://mas.to/@mastometrics" target="_blank" class="font-medium underline">
            me
          </a>{" "}
          know what you think or what features you'd like to see.
        </FAQ>
        <FAQ title="What is the impact of MastoMetrics on my Instance?">
          If you're an instance admin, you might be wondering what the impact of MastoMetrics is on your instance. The
          traffic should be negligible compared to normal clients and apps, but we've taken the following measures to
          ensure we don't negatively impact your instance:
          <br />
          <br />
          <span class="opacity-50">1.</span> We make around 5 requests per 30 minutes for each account to sync their
          data. Of which 1 to fetch their latest profile counts, and max. 4 to fetch their last 120 statuses.
          <br />
          <br />
          <span class="opacity-50">2.</span> All requests are made serially, meaning we wait for the first request to
          finish before sending a new one, so there are no noticable spikes.
          <br />
          <br />
          <span class="opacity-50">3.</span> During signup max. 50 requests are made to fetch the last 2000 statuses,
          and max. 50 requests to create an historic view of follower counts, spread out over multiple minutes.
          <br />
          <br />
          <span class="opacity-50">4.</span> We follow your rate limits and anticipate them, i.e. if the limit is 300
          pages per 15 minutes, we will spread requests so there's around 1 every 3 seconds.
          <br />
          <br />
          Additionally, we're only making authenticated requests and only for the accounts that have signed up for
          MastoMetrics.
        </FAQ>
      </div>
    </Page>
  );
}

const FAQ: ParentComponent<{ title: string }> = (props) => (
  <Box class="my-0 break-inside-avoid-column rounded-lg" title={props.title} isSecondary>
    <p class="max-w-prose leading-relaxed text-gray-500 dark:text-mastodon-purple-100">{props.children}</p>
  </Box>
);
