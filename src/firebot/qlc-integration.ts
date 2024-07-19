import { initRemote } from "../qlc-remote";
import { TypedEmitter } from "tiny-typed-emitter";
import { EventManager } from "@crowbartools/firebot-custom-scripts-types/types/modules/event-manager";
import {
  Integration,
  IntegrationController,
  IntegrationData,
  IntegrationEvents,
} from "@crowbartools/firebot-custom-scripts-types";

type QlcSettings = {
  websocketSettings: {
    ipAddress: string;
    port: number;
  };
  misc: {
    logging: boolean;
  };
};

class IntegrationEventEmitter extends TypedEmitter<IntegrationEvents> {}

class QlcIntegration
  extends IntegrationEventEmitter
  implements IntegrationController<QlcSettings>
{
  connected = false;

  constructor(private readonly eventManager: EventManager) {
    super();
  }

  private setupConnection(settings?: QlcSettings) {
    if (!settings) {
      return;
    }
    const {
      websocketSettings: { ipAddress, port },
      misc: { logging },
    } = settings;
    initRemote(
      {
        ip: ipAddress,
        port,
        logging,
        forceConnect: true,
      },
      {
        eventManager: this.eventManager,
      }
    );
  }

  init(
    linked: boolean,
    integrationData: IntegrationData<QlcSettings>
  ): void | PromiseLike<void> {
    this.setupConnection(integrationData.userSettings);
  }

  onUserSettingsUpdate?(
    integrationData: IntegrationData<QlcSettings>
  ): void | PromiseLike<void> {
    this.setupConnection(integrationData.userSettings);
  }
}

export const getQlcIntegration = (
  eventManager: EventManager
): Integration<QlcSettings> => ({
  definition: {
    id: "QLC",
    name: "QLC Lights",
    description:
      "Connect to QLC Lights to allow Firebot to trigger lighting FX",
    linkType: "none",
    configurable: true,
    connectionToggle: false,
    settingCategories: {
      websocketSettings: {
        title: "Websocket Settings",
        sortRank: 1,
        settings: {
          ipAddress: {
            title: "IP Address",
            description:
              "The ip address of the computer running QLC Lights. Use 'localhost' for the same computer.",
            type: "string",
            default: "localhost",
          },
          port: {
            title: "Port",
            description:
              "Port the QLC Websocket is running on. Default is 9999.",
            type: "number",
            default: 9999,
          },
        },
      },
      misc: {
        title: "Misc",
        sortRank: 2,
        settings: {
          logging: {
            title: "Enable logging for QLC Errors",
            type: "boolean",
            default: true,
          },
        },
      },
    },
  },
  integration: new QlcIntegration(eventManager),
});