
import { ScriptModules } from "@crowbartools/firebot-custom-scripts-types";
import { logger } from "./logger";
//import {WebSocket} from "websocket";
var WebSocketClient = require('websocket').client;

let eventManager: ScriptModules["eventManager"];

let qlcSocket = new WebSocketClient();

let isConnected = false;

interface QlcResolveCallbackType { (value:Array<string> | PromiseLike<Array<string>> ): void }
interface QlcRejectCallbackType { (reason?:any): void }
type QlcResponseType = { 
    resolveCallback:QlcResolveCallbackType,
    rejectCallback:QlcRejectCallbackType,
    timeoutId:NodeJS.Timeout
 }
const pendingRequests = new Map<string, Array<QlcResponseType>>();

export function initRemote(
  {
    ip,
    port,
    logging,
    forceConnect,
  }: {
    ip: string;
    port: number;
    logging: boolean;
    forceConnect?: boolean;
  },
  modules: {
    eventManager: ScriptModules["eventManager"];
  }
) {
  eventManager = modules.eventManager;
  maintainConnection(ip, port, logging, forceConnect);
}

export async function getFunctionsNumber(): Promise<number> {
    try{
        const results = await sendRequest(["getFunctionsNumber"]);
        return Number.parseInt(results[0], 10);    
    } catch(e) {
        logger.error(e.toString());
        return 0;
    }
}

export type QlcFunction = {
    functionId:number,
    functionName:string
}
export async function getFunctionList(): Promise<Array<QlcFunction>> {
    const functionList = new Array<QlcFunction>();
    try{        
        const results = await sendRequest(["getFunctionsList"]);
        for (var index= 0; index < results.length; index+=2)
        {
            const widget:QlcFunction = {
                functionId: Number.parseInt(results[index], 10),
                functionName: results[index+1]
            };
            functionList.push(widget);
        }
        return functionList;    
    } catch(e) {
        logger.error(e.toString());
        return functionList;
    }
}

export async function getFunctionType(functionId:number): Promise<string> {
    try{
        const results = await sendRequest(["getFunctionType", functionId.toString()]);
        return results[0];    
    } catch(e) {
        logger.error(e.toString());
        return "";
    }
}

export async function getFunctionStatus(functionId:number): Promise<boolean> {
    try{
        const results = await sendRequest(["getFunctionStatus", functionId.toString()]);
        return results[0] !== "0";
    } catch(e) {
        logger.error(e.toString());
        return false;
    }
}

export async function setFunctionStatus(functionId:number, enabled:boolean): Promise<boolean> {
    try{
        const success = await sendRequestNoResponse(
            ["setFunctionStatus", functionId.toString(), enabled ? "1" : "0"]);
        return success;
    } catch(e) {
        logger.error(e.toString());
        return false;
    }
}

export async function getWidgetsNumber(): Promise<number> {
    try{
        const results = await sendRequest(["getWidgetsNumber"]);
        return Number.parseInt(results[0], 10);    
    } catch(e) {
        logger.error(e.toString());
        return 0;
    }
}

export type QlcWidget = {
    widgetId:number,
    widgetName:string
}
export async function getWidgetList(): Promise<Array<QlcWidget>> {
    const widgetList = new Array<QlcWidget>();
    try{        
        const results = await sendRequest(["getWidgetsNumberBox"]);
        for (var index= 0; index < results.length; index+=2)
        {
            const widget:QlcWidget = {
                widgetId: Number.parseInt(results[index], 10),
                widgetName: results[index+1]
            };
            widgetList.push(widget);
        }
        return widgetList;    
    } catch(e) {
        logger.error(e.toString());
        return widgetList;
    }
}

export async function getWidgetsType(widgetId:number): Promise<string> {
    try{
        const results = await sendRequest(["getWidgetsType", widgetId.toString()]);
        return results[0];    
    } catch(e) {
        logger.error(e.toString());
        return "";
    }
}

export type QlcWidgetStatus = {
    status:string,
    step:string
}
export async function getWidgetsStatus(widgetId:number): Promise<QlcWidgetStatus> {
    try{
        const results = await sendRequest(["getWidgetStatus", widgetId.toString()]);
        const widgetStatus:QlcWidgetStatus = {
            status: results[0],
            step: (results[0] == "PLAY") ? results[1] : ""
        };
        return widgetStatus;    
    } catch(e) {
        logger.error(e.toString());
        return null;
    }
}

export type QlcChannelValue = {
    channelIndex:number,
    channelValue:number,
    channelType:string
}
export async function getChannelsValues(
    universeIndex:number,
    dmxStartAddress:number,
    channelRange:number): Promise<Array<QlcChannelValue>> {
    const channelValueList = new Array<QlcChannelValue>();
    try{        
        const results = await sendRequest(
            ["QlcChannelValue", 
            universeIndex.toString(),
            dmxStartAddress.toString(),
            channelRange.toString()]);
        for (var index= 0; index < results.length; index+=3)
        {
            const channelValue:QlcChannelValue = {
                channelIndex: Number.parseInt(results[index], 10),
                channelValue: Number.parseInt(results[index+1], 10),
                channelType: results[index+2],
            };
            channelValueList.push(channelValue);
        }
        return channelValueList;    
    } catch(e) {
        logger.error(e.toString());
        return channelValueList;
    }
}

async function sendRequestNoResponse(args:Array<string>): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try{
            if (!isConnected)
                reject("Not connected to QLC");
       
            qlcSocket.send('QLC+API|' + args.join('|'));
            resolve(true);
        } catch(e) {
            reject(e);
        }
    });            
}

async function sendRequest(args:Array<string>): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
        try{
            if (!isConnected)
                reject("Not connected to QLC");
    
            // Enqueue a pending request
            const requestType= args[0];
            const response:QlcResponseType = { 
                resolveCallback: resolve, 
                rejectCallback: reject, 
                timeoutId: null};

            response.timeoutId = setTimeout((inResponse:QlcResponseType) => {
                rejectSinglePending(inResponse, "Response timed out");
            }, 
            1000, 
            response);

            if (pendingRequests.has(requestType))
            {
                pendingRequests.get(requestType).push(response);
            }
            else
            {
                pendingRequests.set(requestType, [response]);
            }
    
            qlcSocket.send('QLC+API|' + args.join('|'));
        } catch(e) {
            reject(e);
        }
    });            
}

function rejectSinglePending(response:QlcResponseType, reason?:any):void{
    pendingRequests.forEach((requests, key, map) => {
        const entryIndex= requests.indexOf(response);
        if (entryIndex !== -1)
        {
            requests[entryIndex].rejectCallback(reason);
            requests.splice(entryIndex, 1);
            return;
        }
    });
}

function rejectAllPending(reason?:any):void {
    pendingRequests.forEach((value, key, map) => {
        value.forEach((response, index, array) => {
            if (response.timeoutId !== null)
            {
                clearTimeout(response.timeoutId);
            }
            response.rejectCallback(reason);
        });
    });
    pendingRequests.clear();
}

let reconnectTimeout: NodeJS.Timeout | null = null;
let isForceClosing = false;
async function maintainConnection(
  ip: string,
  port: number,
  logging: boolean,
  forceClose = false
) {
  if (forceClose && isConnected) {
    isForceClosing = true;
    await qlcSocket.close(3000, "Purposeful Disconnect");
    isConnected = false;
    isForceClosing = false;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (!isConnected) {
    try {
      if (logging) {
        logger.debug("Trying to connect to QLC Websocket...");
      }

      qlcSocket.connect(`ws://${ip}:${port}`);

      qlcSocket.on('error', (error:any) => {
            logger.error("Connection Error: " + error.toString());
        });

      qlcSocket.on('open', () => {
        logger.info("Successfully isConnected to qlcSocket.");
        isConnected = true;
      });

      qlcSocket.on('close', () => {
        if (!isConnected) return;
        isConnected = false;
        rejectAllPending("connection closed");
        if (isForceClosing) return;
        try {
          logger.info("Connection lost, attempting again in 10 secs.");
          reconnectTimeout = setTimeout(
            () => maintainConnection(ip, port, logging),
            10000
          );
        } catch (err) {
          // silently fail
        }
      });

      qlcSocket.on('message', (message:any) => {
        const msgParams:Array<string> = message.utf8Data.toString().split('|');

        if (msgParams.length >= 2 && msgParams[0] == "QLC+API")
        {
            const responseType:string = msgParams[1];
            
            if (pendingRequests.has(responseType))
            {
                const handlerQueue= pendingRequests.get(responseType);

                if (handlerQueue.length > 0)
                {
                    const response:QlcResponseType= handlerQueue.shift();

                    if (response != null)
                    {
                        // Cancel the timeout
                        clearTimeout(response.timeoutId);
                        // Fire off the successful callback
                        response.resolveCallback(msgParams.slice(2));
                    }
                }
            }
        }
      });

    } catch (error) {
      logger.debug("Failed to connect, attempting again in 10 secs.");
      if (logging) {
        logger.debug(error);
      }
      reconnectTimeout = setTimeout(
        () => maintainConnection(ip, port, logging),
        10000
      );
    }
  }
}
