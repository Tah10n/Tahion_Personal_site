import { RepoInput } from "./types";

const githubRepoPattern = /^https?:\/\/(?:www\.)?github\.com\/([^/\s]+)\/([^/#?\s]+)\/?$/i;
const shorthandPattern = /^([^/\s]+)\/([^/#?\s]+)$/;

export function parseGithubRepoUrl(value: string): RepoInput {
  const trimmed = value.trim();
  const match = githubRepoPattern.exec(trimmed) ?? shorthandPattern.exec(trimmed);

  if (!match) {
    throw new Error(
      "Use a public GitHub repository URL, for example https://github.com/Tah10n/pocket-ai.",
    );
  }

  const [, owner, repoWithSuffix] = match;
  const repo = repoWithSuffix.replace(/\.git$/i, "");

  if (!owner || !repo) {
    throw new Error("The GitHub repository URL is incomplete.");
  }

  return {
    owner,
    repo,
    url: `https://github.com/${owner}/${repo}`,
  };
}
