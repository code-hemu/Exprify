export const isDenseMatrixWrapper = (value) =>
  value &&
  typeof value === "object" &&
  value.exprify === "DenseMatrix" &&
  "data" in value &&
  "size" in value;

export const cloneMatrixData = (value) => {
  if (Array.isArray(value)) {
    return value.map(cloneMatrixData);
  }

  return value;
};

export const getMatrixSize = (data) => {
  if (Array.isArray(data) && data.every(Array.isArray)) {
    return [data.length, data[0]?.length || 0];
  }

  if (Array.isArray(data)) {
    return [data.length];
  }

  throw new Error("Matrix data must be an array");
};

export const wrapDenseMatrix = (data) => ({
  exprify: "DenseMatrix",
  data: cloneMatrixData(data),
  size: getMatrixSize(data)
});

export const unwrapDenseMatrix = (value) =>
  isDenseMatrixWrapper(value) ? cloneMatrixData(value.data) : value;

export const serializeExprifyValue = (value) => {
  if (isDenseMatrixWrapper(value)) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value, (_, current) => {
      if (isDenseMatrixWrapper(current)) {
        return current;
      }

      return current;
    });
  }

  return value;
};
