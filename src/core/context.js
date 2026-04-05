export function createContext({ variables, functions, units, evaluate}) {
    if (!variables) throw new Error("Variable store missing");
    if (!functions) throw new Error("Function registry missing");
    if (!units) throw new Error("Units list missing");
    if (!evaluate) throw new Error("evaluate function missing");

    return {
        variables: variables,
        functions: functions,
        units: units,
        evaluate,
        withScope(scope = {}) {
            const tempVars = {
                ...variables.all?.(),
                ...scope
            };
            return createContext({
                functions: functions,
                evaluate,
                units,
                variables: {
                    get: (k) => tempVars[k],
                    set: (k, v) => (tempVars[k] = v),
                    all: () => tempVars
                }
            });

        }
    };
}