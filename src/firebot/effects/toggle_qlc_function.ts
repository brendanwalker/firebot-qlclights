import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import {
    setFunctionStatus,
    getFunctionStatus,
    QlcFunction
} from "../../qlc-remote";

type SourceAction = boolean | "toggle";

type EffectProperties = {
    selectedFunctions: Array<{
      functionId: number;
      action: SourceAction;
    }>;
  };
  
  type Scope = {
    effect: EffectProperties;
    [x: string]: any;
  };
  
  export const ToggleQlcFunctionEffectType: Firebot.EffectType<EffectProperties> = {
    definition: {
      id: "brendanwalker:qlc-toggle-function",
      name: "Toggle QLC Function",
      description: "Toggle function for QLC Lights",
      icon: "fad fa-stars",
      categories: ["common"],
    },
    optionsTemplate: `
      <eos-container header="Functions">
        <div ng-if="functionList != null && functionList.length > 0" ng-repeat="qlcFunction in functionList">
          <div style="font-size: 16px;color: #b9b9b9;margin-bottom: 5px;"><b>{{qlcFunction.name}}</b></div>
          <div ng-repeat="filter in qlcFunction.filters">
            <label  class="control-fb control--checkbox">{{filter.name}}
                <input type="checkbox" ng-click="toggleFunctionsSelected(qlcFunction.functionId)" ng-checked="filterIsSelected(qlcFunction.functionId)"  aria-label="..." >
                <div class="control__indicator"></div>
            </label>
            <div ng-show="filterIsSelected(qlcFunction.functionId)" style="margin-bottom: 15px;">
              <div class="btn-group" uib-dropdown>
                  <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                  {{getFunctionActionDisplay(qlcFunction.functionId)}} <span class="caret"></span>
                  </button>
                  <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                      <li role="menuitem" ng-click="setFunctionAction(qlcFunction.functionId, true)"><a href>Enable</a></li>
                      <li role="menuitem" ng-click="setFunctionAction(qlcFunction.functionId, false)"><a href>Disable</a></li>
                      <li role="menuitem" ng-click="setFunctionAction(qlcFunction.functionId, 'toggle')"><a href>Toggle</a></li>
                  </ul>
              </div>
            </div>
          </div>
        </div>
        <div ng-if="functionList != null && functionList.length < 1" class="muted">
          No functions found.
        </div>
        <div ng-if="functionList == null" class="muted">
          No functions found. Is QLC Lights running?
        </div>
        <p>
            <button class="btn btn-link" ng-click="getFunctionList()">Refresh Filter Data</button>
        </p>
      </eos-container>
    `,
    optionsController: ($scope: Scope, backendCommunicator: any, $q: any) => {
      $scope.functionList = null;
  
      if ($scope.effect.selectedFunctions == null) {
        $scope.effect.selectedFunctions = [];
      }
  
      $scope.functionIsSelected = (functionId: number) => {
        return $scope.effect.selectedFunctions.some(
          (s) => s.functionId === functionId
        );
      };
  
      $scope.toggleFunctionSelected = (functionId: number) => {
        if ($scope.functionIsSelected(functionId)) {
          $scope.effect.selectedFunctions = $scope.effect.selectedFunctions.filter(
            (s) => !(s.functionId === functionId)
          );
        } else {
          $scope.effect.selectedFunctions.push({
            functionId,
            action: true,
          });
        }
      };
  
      $scope.setFunctionAction = (
        functionId: number,
        action: "toggle" | boolean
      ) => {
        const selectedFilter = $scope.effect.selectedFunctions.find(
          (s) => s.functionId === functionId
        );
        if (selectedFilter != null) {
          selectedFilter.action = action;
        }
      };
  
      $scope.getFunctionActionDisplay = (
        functionId: number
      ) => {
        const selectedFilter = $scope.effect.selectedFunctions.find(
          (s) => s.functionId === functionId
        );
        if (selectedFilter == null) return "";
  
        if (selectedFilter.action === "toggle") {
          return "Toggle";
        }
        if (selectedFilter.action === true) {
          return "Enable";
        }
        return "Disable";
      };
   
      $scope.getFunctionList = () => {
        $q.when(
          backendCommunicator.fireEventAsync("qlc-get-functions-list")
        ).then((functionList: Array<QlcFunction>) => {
          $scope.functionList = functionList ?? null;
        });
      };
  
      $scope.getFunctionList();
    },
    optionsValidator: () => {
      return [];
    },
    onTriggerEvent: async ({ effect }) => {
      if (effect.selectedFunctions == null) return true;
  
      for (const { functionId, action } of effect.selectedFunctions) {
        let newVisibility;
        if (action === "toggle") {
          const currentVisibility = await getFunctionStatus(functionId);
          if (currentVisibility == null) continue;
          newVisibility = !currentVisibility;
        } else {
          newVisibility = action === true;
        }
  
        await setFunctionStatus(functionId, newVisibility);
      }
  
      return true;
    },
  };