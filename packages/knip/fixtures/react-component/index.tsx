import * as React from "react";
import {
    MyComponent,
    ComponentInterfaceFC,
    ComponentTypeFC,
    ComponentFunction,
    ComponentFunctionDestructured,
    ComponentClass,
} from "./components";

export const App = () => {
    return (
        <React.Fragment>
            <MyComponent />
            <ComponentInterfaceFC used={true} />
            <ComponentTypeFC used={true} />
            <ComponentFunction used={true} />
            <ComponentFunctionDestructured used={true} />
            <ComponentClass used={true} />
        </React.Fragment>
    );
};
