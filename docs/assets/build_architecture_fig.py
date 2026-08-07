"""Tall single-column architecture diagram for Table (Fig. 1).

Drawn at exactly IEEE columnwidth (3.5in) so \includegraphics[width=\columnwidth]
applies no scaling and every point size below is the true rendered size.
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUT = Path(r"C:\Users\nwoke\Documents\GitHub\comp47360-team2\docs\assets")

# --- palette ---------------------------------------------------------------
INK       = "#1a2b3c"
GCP_FILL  = "#f2f6fb"
GCP_EDGE  = "#c3d4e8"
CLI_FILL  = "#f7f7f8"
CLI_EDGE  = "#d8d8dc"
BOX_FILL  = "#ffffff"
BOX_EDGE  = "#b9c4d1"
GW_FILL   = "#e4eefb"
GW_EDGE   = "#4a7fbf"
ARROW     = "#2c5f96"
MUTED     = "#6b7785"

# --- type scale (points, true size at columnwidth) -------------------------
FS_REGION = 6.4     # region headers
FS_TITLE  = 7.2     # box titles
FS_SUB    = 6.0     # platform note
FS_REL    = 5.9     # interaction note
FS_EDGE   = 6.0     # arrow labels

fig = plt.figure(figsize=(3.5, 4.45))
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis("off")


def region(x0, y0, x1, y1, fill, edge, label, dashed=False):
    ax.add_patch(FancyBboxPatch(
        (x0, y0), x1 - x0, y1 - y0,
        boxstyle="round,pad=0,rounding_size=0.018",
        facecolor=fill, edgecolor=edge, linewidth=0.7,
        linestyle=(0, (4, 2)) if dashed else "solid", zorder=1))
    ax.text(x0 + 0.028, y1 - 0.022, label, fontsize=FS_REGION, color=MUTED,
            fontweight="bold", va="top", ha="left", zorder=3)


def box(x0, y0, x1, y1, title, sub=None, rel=None, gateway=False):
    ax.add_patch(FancyBboxPatch(
        (x0, y0), x1 - x0, y1 - y0,
        boxstyle="round,pad=0,rounding_size=0.014",
        facecolor=GW_FILL if gateway else BOX_FILL,
        edgecolor=GW_EDGE if gateway else BOX_EDGE,
        linewidth=1.0 if gateway else 0.7, zorder=2))
    cx = (x0 + x1) / 2
    lines = [t for t in (sub, rel) if t]
    # vertically centre the stack of 1-3 lines
    top = (y0 + y1) / 2 + (0.011 * len(lines))
    ax.text(cx, top, title, fontsize=FS_TITLE, fontweight="bold", color=INK,
            ha="center", va="center", zorder=3)
    dy = top
    if sub:
        dy -= 0.0225
        ax.text(cx, dy, sub, fontsize=FS_SUB, color=MUTED,
                ha="center", va="center", zorder=3)
    if rel:
        dy -= 0.021
        ax.text(cx, dy, rel, fontsize=FS_REL, color=ARROW, style="italic",
                ha="center", va="center", zorder=3)


def arrow(p0, p1, both=False, lw=0.9):
    ax.add_patch(FancyArrowPatch(
        p0, p1, arrowstyle="<|-|>" if both else "-|>",
        mutation_scale=6.5, linewidth=lw, color=ARROW,
        shrinkA=0, shrinkB=0, zorder=4,
        joinstyle="miter", capstyle="butt"))


# ---------------------------------------------------------------- clients --
region(0.015, 0.845, 0.985, 0.995, CLI_FILL, CLI_EDGE, "CLIENT APPLICATIONS")
box(0.045, 0.862, 0.492, 0.947, "React / Vite", "web app")
box(0.508, 0.862, 0.955, 0.947, "Expo", "mobile app")

# ------------------------------------------------------------------- GCP --
region(0.015, 0.048, 0.985, 0.792, GCP_FILL, GCP_EDGE,
       "GOOGLE CLOUD PLATFORM")

GW_TOP, GW_BOT = 0.735, 0.648
box(0.055, GW_BOT, 0.945, GW_TOP, "Node.js API Gateway", "Cloud Run",
    gateway=True)

# clients -> gateway
arrow((0.27, 0.862), (0.34, GW_TOP), both=True)
arrow((0.73, 0.862), (0.66, GW_TOP), both=True)
ax.text(0.503, 0.8185, "HTTPS", fontsize=FS_EDGE, color=ARROW,
        ha="center", va="center", zorder=5,
        bbox=dict(boxstyle="round,pad=0.12", facecolor="white",
                  edgecolor="none"))

# vertical spine from the gateway down the left gutter
SPINE_X = 0.125
SERV_L, SERV_R = 0.235, 0.945
services = [
    (0.510, 0.605, "PostgreSQL", "Cloud SQL",
     "reads / writes busyness scores", True),
    (0.372, 0.467, "FastAPI Inference", "Cloud Run",
     "prediction requests / results", True),
    (0.234, 0.329, "Google Routes API", "external",
     "ETA validation (cached)", False),
    (0.096, 0.191, "Firebase Messaging", "FCM",
     "flash-deal push delivery", False),
]

ax.plot([SPINE_X, SPINE_X], [services[-1][0] + 0.0475, GW_BOT],
        color=ARROW, linewidth=0.9, zorder=3, solid_capstyle="butt")

for y0, y1, title, sub, rel, both in services:
    box(SERV_L, y0, SERV_R, y1, title, sub, rel)
    arrow((SPINE_X, (y0 + y1) / 2), (SERV_L, (y0 + y1) / 2), both=both)

OUT.mkdir(parents=True, exist_ok=True)
fig.savefig(OUT / "fig1_architecture.pdf")
fig.savefig(OUT / "fig1_architecture.png", dpi=400)
print("wrote", OUT / "fig1_architecture.pdf")
print("wrote", OUT / "fig1_architecture.png")
print(f"figure size: {fig.get_size_inches()[0]:.2f} x {fig.get_size_inches()[1]:.2f} in")
