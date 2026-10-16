import type { Component } from "solid-js";
import { startSupport } from "~/lib/support";
import { UIButton } from "../Button";

export const PeopleFeedbackButton: Component<{ account: { instance: string } }> = (props) => (
  <UIButton onClick={() => startSupport(props.account, "Feedback on 'People' page:")} class="mt-4 !px-2 !py-1 text-sm">
    Leave feedback
  </UIButton>
);
