import { MessageAttributeValue } from './types';

export interface FilterEvaluationResult {
  matches: boolean;
  explanation: string;
  failedAttribute?: string;
}

/**
 * Evaluates an Amazon SNS Subscription Filter Policy against published Message Attributes.
 * Follows official AWS SNS Filter Policy evaluation rules:
 * - Filter policy is a JSON object whose keys correspond to message attribute names.
 * - Logical AND between different attributes.
 * - Logical OR between elements within the list for a single attribute.
 * - If filter policy is empty or null, it matches ALL messages.
 */
export function evaluateSnsFilterPolicy(
  filterPolicy: Record<string, any> | null | undefined,
  messageAttributes: Record<string, MessageAttributeValue> | undefined
): FilterEvaluationResult {
  // If no filter policy, SNS delivers everything
  if (!filterPolicy || Object.keys(filterPolicy).length === 0) {
    return {
      matches: true,
      explanation: 'No subscription filter policy configured. Accepts all messages.'
    };
  }

  const attrs = messageAttributes || {};

  for (const [key, rules] of Object.entries(filterPolicy)) {
    if (!Array.isArray(rules)) {
      // SNS filter policies require array of rules
      return {
        matches: false,
        failedAttribute: key,
        explanation: `Invalid filter policy rule for '${key}': must be an array of matching criteria.`
      };
    }

    const messageAttr = attrs[key];
    const attributeExists = messageAttr !== undefined && messageAttr !== null;
    const attrValue = attributeExists
      ? (messageAttr.StringValue !== undefined ? messageAttr.StringValue : messageAttr.NumberValue?.toString())
      : undefined;

    let anyRulePassed = false;
    let ruleDescriptions: string[] = [];

    for (const rule of rules) {
      if (typeof rule === 'string' || typeof rule === 'number') {
        ruleDescriptions.push(`="${rule}"`);
        if (attributeExists && String(attrValue) === String(rule)) {
          anyRulePassed = true;
          break;
        }
      } else if (typeof rule === 'object' && rule !== null) {
        // Exists rule
        if ('exists' in rule) {
          const expectedExists = Boolean(rule.exists);
          ruleDescriptions.push(`exists=${expectedExists}`);
          if (attributeExists === expectedExists) {
            anyRulePassed = true;
            break;
          }
        }
        // Prefix rule
        else if ('prefix' in rule && typeof rule.prefix === 'string') {
          ruleDescriptions.push(`prefix="${rule.prefix}"`);
          if (attributeExists && typeof attrValue === 'string' && attrValue.startsWith(rule.prefix)) {
            anyRulePassed = true;
            break;
          }
        }
        // Anything-but rule
        else if ('anything-but' in rule) {
          const anythingBut = rule['anything-but'];
          if (Array.isArray(anythingBut)) {
            ruleDescriptions.push(`anything-but [${anythingBut.join(', ')}]`);
            if (attributeExists && !anythingBut.map(String).includes(String(attrValue))) {
              anyRulePassed = true;
              break;
            }
          } else if (typeof anythingBut === 'string' || typeof anythingBut === 'number') {
            ruleDescriptions.push(`anything-but "${anythingBut}"`);
            if (attributeExists && String(attrValue) !== String(anythingBut)) {
              anyRulePassed = true;
              break;
            }
          } else if (typeof anythingBut === 'object' && anythingBut !== null && 'prefix' in anythingBut) {
            ruleDescriptions.push(`anything-but prefix "${anythingBut.prefix}"`);
            if (attributeExists && typeof attrValue === 'string' && !attrValue.startsWith(anythingBut.prefix)) {
              anyRulePassed = true;
              break;
            }
          }
        }
        // Numeric range rule
        else if ('numeric' in rule && Array.isArray(rule.numeric)) {
          const numTokens = rule.numeric;
          ruleDescriptions.push(`numeric [${numTokens.join(' ')}]`);
          if (attributeExists) {
            const numVal = Number(attrValue);
            if (!isNaN(numVal)) {
              let numericMatch = true;
              for (let i = 0; i < numTokens.length; i += 2) {
                const op = numTokens[i];
                const threshold = Number(numTokens[i + 1]);
                if (op === '=' && !(numVal === threshold)) numericMatch = false;
                if (op === '>' && !(numVal > threshold)) numericMatch = false;
                if (op === '>=' && !(numVal >= threshold)) numericMatch = false;
                if (op === '<' && !(numVal < threshold)) numericMatch = false;
                if (op === '<=' && !(numVal <= threshold)) numericMatch = false;
              }
              if (numericMatch) {
                anyRulePassed = true;
                break;
              }
            }
          }
        }
      }
    }

    if (!anyRulePassed) {
      const currentValDisplay = attributeExists ? `"${attrValue}"` : '<missing>';
      return {
        matches: false,
        failedAttribute: key,
        explanation: `Attribute '${key}' (${currentValDisplay}) failed filter condition [${ruleDescriptions.join(' OR ')}].`
      };
    }
  }

  return {
    matches: true,
    explanation: 'Matched all subscription filter policy attribute criteria.'
  };
}
