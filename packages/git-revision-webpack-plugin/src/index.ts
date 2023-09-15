import buildFile from './build-file'
import runGitCommand from './helpers/run-git-command'
import { Compiler } from 'webpack'

const COMMITHASH_COMMAND = 'rev-parse HEAD'
const VERSION_COMMAND = 'describe --always'
const BRANCH_COMMAND = 'rev-parse --abbrev-ref HEAD'
const LASTCOMMITDATETIME_COMMAND = 'log -1 --format=%cI'
const REMOTE_COMMAND = 'remote get-url origin'

interface GitRevisionPluginOptions {
  gitWorkTree?: string
  commithashCommand?: string
  versionCommand?: string
  branch?: boolean
  branchCommand?: string
  lastCommitDateTimeCommand?: string
  lightweightTags?: boolean
  remoteCommand?: string
}

export class GitRevisionPlugin {
  gitWorkTree?: string
  commithashCommand: string
  versionCommand: string
  createBranchFile: boolean
  branchCommand: string
  lastCommitDateTimeCommand: string
  remoteCommand: string

  constructor(options: GitRevisionPluginOptions = {}) {
    this.gitWorkTree = options.gitWorkTree
    this.commithashCommand = options.commithashCommand || COMMITHASH_COMMAND
    this.versionCommand = options.versionCommand || VERSION_COMMAND + (options.lightweightTags ? ' --tags' : '')
    this.createBranchFile = options.branch || false
    this.branchCommand = options.branchCommand || BRANCH_COMMAND
    this.lastCommitDateTimeCommand = options.lastCommitDateTimeCommand || LASTCOMMITDATETIME_COMMAND
    this.remoteCommand = options.remoteCommand || REMOTE_COMMAND

    if (options.versionCommand && options.lightweightTags) {
      throw new Error("lightweightTags can't be used together versionCommand")
    }
  }

  commithash() {
    return runGitCommand(this.gitWorkTree, this.commithashCommand)
  }

  version() {
    return runGitCommand(this.gitWorkTree, this.versionCommand)
  }

  branch() {
    return runGitCommand(this.gitWorkTree, this.branchCommand)
  }

  lastcommitdatetime() {
    return runGitCommand(this.gitWorkTree, this.lastCommitDateTimeCommand)
  }

  remote() {
    return runGitCommand(this.gitWorkTree, this.remoteCommand)
  }

  apply(compiler: Compiler) {
    buildFile({
      compiler: compiler,
      gitWorkTree: this.gitWorkTree,
      command: this.commithashCommand,
      replacePattern: /\[git-revision-hash\]/gi,
      asset: 'COMMITHASH',
    })

    buildFile({
      compiler: compiler,
      gitWorkTree: this.gitWorkTree,
      command: this.versionCommand,
      replacePattern: /\[git-revision-version\]/gi,
      asset: 'VERSION',
    })

    buildFile({
      compiler: compiler,
      gitWorkTree: this.gitWorkTree,
      command: this.lastCommitDateTimeCommand,
      replacePattern: /\[git-revision-last-commit-datetime\]/gi,
      asset: 'LASTCOMMITDATETIME',
    })

    buildFile({
      compiler: compiler,
      gitWorkTree: this.gitWorkTree,
      command: this.remoteCommand,
      replacePattern: /\[git-revision-remote\]/gi,
      asset: 'REMOTE',
    })

    if (this.createBranchFile) {
      buildFile({
        compiler: compiler,
        gitWorkTree: this.gitWorkTree,
        command: this.branchCommand,
        replacePattern: /\[git-revision-branch\]/gi,
        asset: 'BRANCH',
      })
    }
  }
}
