import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { initLogger, logger } from "./logger";
import { setupFrontendListeners } from "./firebot/communicator";
import { getQlcIntegration } from "./firebot/qlc-integration";

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
      eventFilterManager,
      integrationManager,
    } = modules;

    setupFrontendListeners(frontendCommunicator);

    const qlcIntegration = getQlcIntegration(eventManager);
    integrationManager.registerIntegration(qlcIntegration);

    // effectManager.registerEffect(ChangeSceneEffectType);
    // effectManager.registerEffect(ChangeSceneCollectionEffectType);
    // effectManager.registerEffect(ToggleSourceVisibilityEffectType);
    // effectManager.registerEffect(ToggleSourceFilterEffectType);
    // effectManager.registerEffect(ToggleSourceMutedEffectType);
    // effectManager.registerEffect(StartStreamEffectType);
    // effectManager.registerEffect(StopStreamEffectType);
    // effectManager.registerEffect(StartVirtualCamEffectType);
    // effectManager.registerEffect(StopVirtualCamEffectType);

    // eventManager.registerEventSource(OBSEventSource);

    // eventFilterManager.registerFilter(SceneNameEventFilter);

    // replaceVariableManager.registerReplaceVariable(SceneNameVariable);
    // replaceVariableManager.registerReplaceVariable(SceneCollectionNameVariable);
  },
};

export default script;
