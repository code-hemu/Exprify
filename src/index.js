/**
 * Exprify — Math Expression Parser & Evaluator
 *
 * A lightweight JavaScript library for parsing and evaluating mathematical expressions
 * with runtime data-type checking.
 *
 * Author: Nirmal Paul (N Paul)
 * GitHub: https://github.com/nirmalpaul383
 *
 * License: GNU General Public License v3.0 (GPLv3)
 *
 * Note:
 * This project is licensed under GPLv3. While not legally required,
 * attribution is highly appreciated. If you use, modify, or distribute
 * this project, please give credit to the original author.
 *
 * This library has been carefully designed with clean, structured, and
 * maintainable code. Acknowledgment of the original work is encouraged.
 *
 * Resources:
 * GitHub Repository: https://github.com/nirmalpaul383/ViewPoint
 * YouTube Channel:   https://www.youtube.com/channel/UCY6JY8bTlR7hZEvhy6Pldxg/
 * Facebook Page:    https://www.facebook.com/a.New.Way.Technical/
 */

import Exprify from "./core/Exprify.js";
import { mathOperations } from "./math/operations.js";
import { internalFunctions } from "./functions/internalFunctions.js";
import { externalFunctions } from "./functions/externalFunctions.js";
import { variablesDB } from "./variables/variables.js";

export {
  Exprify,
  mathOperations,
  internalFunctions,
  externalFunctions,
  variablesDB
};