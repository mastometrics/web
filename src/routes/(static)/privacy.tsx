import { Page } from "~/components/Page";

export default function PrivacyPolicyRoute() {
  return (
    <Page title="Privacy Policy">
      <div class="prose prose-headings:text-mastodon-purple-700 prose-p:text-mastodon-purple-900/70 prose-li:text-mastodon-purple-900/70 prose-li:marker:text-mastodon-purple-500 dark:prose-invert dark:prose-headings:text-mastodon-purple-200 dark:prose-p:text-mastodon-purple-100 dark:prose-li:text-mastodon-purple-100">
        <h1>Privacy Policy</h1>
        <p class="text-lg font-medium !text-mastodon-purple-500">
          <span class="opacity-60">TL;DR:</span> MastoMetrics users can opt-in (sign up) to get insights about their
          activity and interactions on Mastodon. We collect and store only publicly available data about your Mastodon
          account and posts, and only to provide insights to you alone.
        </p>

        <h2>Your responsibility</h2>
        <ul>
          <li>
            Do not use our application if you aren’t interested in historical data and insights into your Mastodon
            Account.
          </li>
          <li>
            Any public posts or profile updates that you publish on your Mastodon Account we consider public
            information. As a general best practice, do not post (Sensitive) Personal Information about yourself or
            others. While you explicitly ask us to store your activity, many other systems may track your activity
            without your consent.
          </li>
          <li>Request for your account to be deleted if you no longer wish to use MastoMetrics.</li>
        </ul>

        <h2>Data Collected</h2>
        <p>When opting-in (signing up) for MastoMetrics we store and collect data about you:</p>
        <ul>
          <li>
            Your public Mastodon Account / Profile, specifically your username, display name, bio/note, profile links,
            profile picture and header picture.
          </li>
          <li>
            Your public Mastodon posts (including “follower only” posts but excluding “Direct Messages”), specifically
            the content posted, links, people mentioned and media shared. If you boost a post, we store the same
            information, in addition to the public profile information of the account you are boosting.
          </li>
          <li>
            Metrics and the progression of those metrics about your account and posts, like the number of followers,
            following and interactions such as favorites, replies and boosts.
          </li>
          <li>
            For both your posts and your account, we store a cached version of the ‘raw’ API response in order to
            regenerate data attributes in the future without burdening your Mastodon instance with new requests.
          </li>
          <li>
            We store minimal information about your activity on MastoMetrics, specifically we only store the time you
            signed up and the last time you logged in.
          </li>
          <li>We store a read-only API Access Token to your Mastodon Instance so we can import data periodically.</li>
          <li>
            We may (while not as part of our core data or application) store your browser and IP information,
            structurally or by accident, in access logs or server proxies. In all of these cases the data is not
            connected to your Mastodon Account.
          </li>
        </ul>
        <p>For clarity:</p>
        <ul>
          <li> We do not store or require your email address</li>
          <li> We do not store or process any “Direct Messages”, posts explicitly marked as a ‘private’ mention.</li>
          <li>
            We do not store or track accounts that don’t sign up for MastoMetrics, except as part of a single ‘boost’.
          </li>
          <li>
            We do not store or track your IP Address, browser or device information in connection to your account.
          </li>
        </ul>

        <p>
          We store data for as long as you have an account, as providing historic insights is one of the main purposes
          of our platform. This includes any posts that you may have deleted at a later point, since we do not have a
          reliable or practical method of detecting deleted posts.
        </p>

        <h2>Purposes</h2>
        <p>We store and collect your data for only the following reasons:</p>
        <ul>
          <li>
            Provide users, individually, with historical insights on the number and type of interaction their Mastodon
            profile and posts receive.
          </li>
          <li> Provide users with insights and helpful tools to enhance their Mastodon experience.</li>
          <li>
            Occasionally, for the purpose of developing new features for the platform and providing you with support if
            you interact with us, we may inspect your account and data, granted this only includes the publicly
            available data about your account.
          </li>
        </ul>
        <p>For clarity:</p>
        <ul>
          <li> We do not provide the data we store for your to anyone else except you.</li>
          <li> We do not run aggregate analytics or data analysis across accounts.</li>
          <li>
            We do not sell, share or otherwise distribute your data to any 3rd party except for the purposes of hosting
            and providing the application.
          </li>
        </ul>

        <h2>Consent</h2>
        <p>
          We only start collecting your data after explicit consent through signing up for MastoMetrics. If signed up
          and you want to opt-out from processing, please contact us at @mastometrics@mas.to from the Mastodon Account
          you want to opt-out. After you opted out all your account data will be deleted.
        </p>

        <h2>Third Parties (Vendors)</h2>
        <p>
          The following third party organizations are used to host and provide the application and may receive or store
          the data collected as part of normal operations:
        </p>
        <ul>
          <li> Application and database hosting: Railway, which itself uses Google Cloud Platform</li>
          <li> Proxying and content delivery: CloudFlare</li>
          <li> Logging and service monitoring: Logsnag</li>
        </ul>
        <p>
          In all cases these 3rd parties only process or access data for the purposes of providing the application to
          you, and will not user, sell or distribute your data for any other purposes.
        </p>

        <h2>Cookies</h2>
        <p>
          No tracking cookies are used. The only cookie placed by MastoMetrics is a session cookie while you are logged
          in to authenticate your web requests.
        </p>

        <h2>Location</h2>
        <p>
          The Primary location of the data stored is Google Cloud Platform, in region US-West. The legal location or
          basis of operation for ’MastoMetrics’ is Amsterdam, The Netherlands, Europe.
        </p>

        <h2>Security</h2>
        <p>We follow strong but basic security principles to minimize the risk and exposure of the data we store.</p>
        <ul>
          <li>
            <em>Minimization</em> - As far as possible, we only store publicly available information.
          </li>
          <li>
            <em>Transfer Restriction</em> - Data never leaves the application servers in any form of export or download,
            except through the normal web application and usage.
          </li>
          <li>
            <em>Access Control</em> - Access is limited to the developer and vendors of MastoMetrics, no 3rd parties or
            individuals get access to the collected data. Access to data is protected through multi-factor login
            providers.
          </li>
          <li>
            <em>Encryption</em> – Data transfer to you and between servers is encrypted using TLS.
          </li>
        </ul>

        <h2>GDPR</h2>
        <p>
          We respect, embrace and encourage the rights and regulations that the General Data Protection Regulation
          (GDPR) provides. We intent to implement some of your rights as features in the future (i.e. data portability
          and right of erasure), in the meantime you can always call on your rights by contacting us.
        </p>

        <h2>Changes to our Policy</h2>
        <p>
          We expect to make several changes in our Privacy Policy as we continue with the development by adding new
          features. Changes to our policy will be communicated on our Mastodon Account: <Contact />
        </p>

        <h2>Contact</h2>
        <p>
          If you have any worries or concerns about your privacy or feedback to this policy feel free to reach out to{" "}
          <Contact />
        </p>

        <p>
          MastoMetrics is developed by Robert van Hoesel in The Netherlands. MastoMetrics is not a formal legal
          (non-person) entity, but may become one in the future.
        </p>
      </div>
    </Page>
  );
}

const Contact = () => {
  return (
    <a href="https://mas.to/@mastometrics@mas.to" target="_blank" rel="noopener noreferrer">
      @mastometrics@mas.to
    </a>
  );
};
