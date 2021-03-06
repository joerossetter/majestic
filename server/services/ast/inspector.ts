import traverse from "@babel/traverse";
import * as nanoid from "nanoid";
import { parse } from "./parser";
import { readFile } from "fs";
import { TestItem, TestItemType } from "../../api/workspace/test-item";

export async function inspect(path: string): Promise<TestItem[]> {
  return new Promise((resolve, reject) => {
    readFile(
      path,
      {
        encoding: "utf8"
      },
      (err, code) => {
        if (err) {
          reject(err);
        }

        const ast = parse(path, code);
        const result: TestItem[] = [];

        traverse(ast, {
          CallExpression(path: any) {
            if (path.scope.block.type === "Program") {
              findItems(path, result);
            }
          }
        });
        resolve(result);
      }
    );
  });
}

function findItems(
  path: any,
  result: TestItem[],
  parentId?: any
) {
  let type: string;
  let only: boolean = false;
  if (path.node.callee.name === "fdescribe") {
    type = "describe";
    only = true;
  } else if (path.node.callee.name === "fit") {
    type = "it";
    only = true;
  } else if (
    path.node.callee.property &&
    path.node.callee.property.name === "only"
  ) {
    type = path.node.callee.object.name;
    only = true;
  } else if (path.node.callee.name === "test") {
    type = "it";
  } else {
    type = path.node.callee.name;
  }

  if (type === "describe") {
    const describe = {
      id: nanoid(),
      type: "describe" as TestItemType,
      name: path.node.arguments[0].value,
      only,
      parent: parentId
    };
    result.push(describe);
    path.skip();
    path.traverse({
      CallExpression(itPath: any) {
        findItems(itPath, result, describe.id);
      }
    });
  } else if (type === "it") {
    result.push({
      id: nanoid(),
      type: "it",
      name: path.node.arguments[0].value,
      only,
      parent: parentId
    });
  }
}
