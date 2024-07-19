import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import {    
    getFunctionsNumber,
    QlcFunction,
    getFunctionList,
    getWidgetsNumber,
    QlcWidget,
    getWidgetList,
} from "../qlc-remote";

export function setupFrontendListeners(
    frontendCommunicator: ScriptModules["frontendCommunicator"]
  ) {
    frontendCommunicator.onAsync<never, number>(
        "qlc-get-functions-count",
        getFunctionsNumber
      );

    frontendCommunicator.onAsync<never, Array<QlcFunction>>(
        "qlc-get-functions-list",
        getFunctionList
      );
   
    frontendCommunicator.onAsync<never, number>(
        "qlc-get-widget-count",
        getWidgetsNumber
    );

    frontendCommunicator.onAsync<never, Array<QlcWidget>>(
        "qlc-get-widget-list",
        getWidgetList
    );    
  }