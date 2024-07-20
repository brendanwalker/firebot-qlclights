import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { initLogger, logger } from "./logger";
import { setupFrontendListeners } from "./firebot/communicator";
import { getQlcIntegration } from "./firebot/qlc-integration";
import { ToggleQlcFunctionEffectType } from "./firebot/effects/toggle_qlc_function"

const script: Firebot.CustomScript = {
  getScriptManifest: () => {
    return {
      name: "Starter Custom Script",
      description: "A starter custom script for build",
      author: "SomeDev",
      version: "1.0",
      firebotVersion: "5",
    };
  },
  getDefaultParameters: () => {
    return {};
  },
  run: ({ modules }) => {
    initLogger(modules.logger);

    logger.info("Starting QLC Control...");

    const {
      effectManager,
      eventManager,
      frontendCommunicator,
      replaceVariableManager,
      integrationManager,
    } = modules;

    setupFrontendListeners(frontendCommunicator);

    const qlcIntegration = getQlcIntegration(eventManager);
    integrationManager.registerIntegration(qlcIntegration);

    effectManager.registerEffect(ToggleQlcFunctionEffectType);

    // replaceVariableManager.registerReplaceVariable(SceneNameVariable);
    // replaceVariableManager.registerReplaceVariable(SceneCollectionNameVariable);
  },
};

export default script;
