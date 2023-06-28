import { ParentComponent } from "solid-js";
import { Box } from "./Box";
import { startSupport } from "~/lib/support";

export const MaintenanceGuard: ParentComponent = (props) => {
  const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE == "true";

  return (
    <>
      {maintenanceMode ? (
        <div class="container mx-auto max-w-4xl p-4 sm:px-6 sm:pb-8 ">
          <Box title="Server Maintenance" class="text-center">
            We're currently performing server maintenance. During this time your dashboard is unavailable.
            <br />
            Please check back later or{" "}
            <a onClick={() => startSupport()} href="https://mas.to/@mastometrics" class="font-bold hover:underline">
              contact support
            </a>{" "}
            if you have any questions.
          </Box>
        </div>
      ) : (
        props.children
      )}
    </>
  );
};
