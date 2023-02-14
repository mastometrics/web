import { ParentComponent } from "solid-js";
import { Title } from "solid-start";
import logo from "~/assets/logo.svg";

export const Page: ParentComponent<{ title: string }> = (props) => {
  return (
    <>
      <Title>{props.title}</Title>
      <div class="bg-mastodon-purple-700">
        <div class="container mx-auto flex max-w-4xl items-center py-4 px-6">
          <img src={logo} />
          <div class="flex-auto"></div>
        </div>
      </div>
      <div class="container mx-auto max-w-4xl p-2 sm:py-12 sm:px-6">{props.children}</div>
    </>
  );
};
