// Metro 설정 — careflow-app(모바일)이 상위 폴더의 공용 로직(../lib/*)을 직접 import할 수 있게 함.
// 목적: lib/domain/socialReturnIndicators.ts, lib/domain/nursingLogic.ts처럼
// 웹·모바일이 동일하게 필요한 순수 로직을 파일 복사 없이 공유하기 위함.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// careflow/ 루트(웹 프로젝트 포함)까지 감시 대상에 포함
config.watchFolders = [workspaceRoot]

// 루트 node_modules도 함께 찾도록 설정 (공용 로직이 향후 외부 패키지를 쓰게 되는 경우 대비)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
