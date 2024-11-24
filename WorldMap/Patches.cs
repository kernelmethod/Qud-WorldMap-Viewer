using HarmonyLib;
using Qud.API;

namespace Kernelmethod.WorldMap.Patches {
    [HarmonyPatch(typeof(IBaseJournalEntry), nameof(IBaseJournalEntry.DisplayMessage))]
    public static class IBaseJournalEntryPatches {
        public static bool DisableMessages = false;

        public static bool Prefix() {
            return !DisableMessages;
        }
    }
}
