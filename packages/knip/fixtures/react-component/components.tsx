import React from "react";
import { ComponentTypeFCProps, ComponentFunctionProps } from "./externalProps";

// Simple component without props, should be ignored
export const MyComponent = () => null;

export interface ComponentInterfaceFCProps {
    used: boolean;
    unused?: boolean;
}

export const ComponentInterfaceFC: React.FC<ComponentInterfaceFCProps> = (
    props: ComponentInterfaceFCProps
) => {
    return null;
};

export const ComponentTypeFC: React.FC<ComponentTypeFCProps> = (
    props: ComponentTypeFCProps
) => {
    return null;
};

export function ComponentFunction(props: ComponentFunctionProps) {
    // Usages inside the component should not count
    if (props.used || props.unused) {
        return null;
    }
    return null;
}

interface ComponentFunctionDestructuredProps {
    used: boolean;
    unused?: boolean;
}

export function ComponentFunctionDestructured({
    used,
    unused,
}: ComponentFunctionDestructuredProps) {
    // Usages inside the component should not count
    if (used || unused) {
        return null;
    }
    return null;
}

interface ComponentClassProps {
    used: boolean;
    unused?: boolean;
}

export class ComponentClass extends React.Component<ComponentClassProps> {
    render() {
        return null;
    }
}


