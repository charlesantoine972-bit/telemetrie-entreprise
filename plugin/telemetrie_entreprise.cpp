// Plugin de télémétrie "Télémétrie Entreprise" pour Euro Truck Simulator 2 / American Truck Simulator.
//
// Rôle : lire les infos du camion via le SDK officiel de SCS et les envoyer
// à l'application (UDP local 127.0.0.1:47311), en JSON, environ 10 fois par seconde.
// Le plugin n'affiche rien et ne modifie rien dans le jeu. Si l'application est
// fermée, les messages sont simplement perdus : le jeu fonctionne normalement.

#define WIN32_LEAN_AND_MEAN
#include <winsock2.h>
#include <windows.h>
#include <cstdio>
#include <cstring>
#include <string>
#include <map>

#include "scssdk_telemetry.h"
#include "eurotrucks2/scssdk_eut2.h"
#include "eurotrucks2/scssdk_telemetry_eut2.h"
#include "amtrucks/scssdk_ats.h"
#include "amtrucks/scssdk_telemetry_ats.h"
#include "common/scssdk_telemetry_common_configs.h"
#include "common/scssdk_telemetry_common_channels.h"
#include "common/scssdk_telemetry_common_gameplay_events.h"
#include "common/scssdk_telemetry_truck_common_channels.h"
#include "common/scssdk_telemetry_trailer_common_channels.h"
#include "common/scssdk_telemetry_job_common_channels.h"

#define PLUGIN_VERSION "1.2.0"
static const unsigned short APP_PORT = 47311;

// ---------------------------------------------------------------- état
struct Telemetry {
    float speed = 0;            // m/s
    float odometer = 0;         // km
    double x = 0, y = 0, z = 0; // position monde (m)
    float heading = 0;          // 0..1
    float navDistance = 0;      // m
    float localScale = 0;     // 0 = canal non disponible
    float navTime = 0;          // s
    float speedLimit = 0;       // m/s
    float fuel = 0;             // L
    float fuelRange = 0;        // km
    float cargoDamage = 0;      // 0..1
    unsigned gameTime = 0;      // minutes depuis le début
    int restStop = 0;           // minutes avant la pause obligatoire
    bool trailerConnected = false;
    bool engine = false;
    bool parkingBrake = false;
} t;

static bool paused = true;
static std::string gameId;
static unsigned gameVersion = 0;
static std::string truckJson = "null";
static std::string trailerJson = "null";
static std::string jobJson = "null";
static std::string busJobJson = "null";
static scs_log_t gameLog = nullptr;

static SOCKET sock = INVALID_SOCKET;
static sockaddr_in appAddr;
static ULONGLONG lastSend = 0;

// ---------------------------------------------------------------- JSON
static std::string esc(const char *s) {
    std::string o = "\"";
    if (s) for (const unsigned char *p = (const unsigned char *)s; *p; ++p) {
        if (*p == '"' || *p == '\\') { o += '\\'; o += (char)*p; }
        else if (*p < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", *p); o += b; }
        else o += (char)*p;
    }
    return o + "\"";
}

static std::string valueJson(const scs_value_t &v) {
    char b[128];
    switch (v.type) {
        case SCS_VALUE_TYPE_bool:   return v.value_bool.value ? "true" : "false";
        case SCS_VALUE_TYPE_s32:    snprintf(b, sizeof b, "%d", v.value_s32.value); return b;
        case SCS_VALUE_TYPE_u32:    snprintf(b, sizeof b, "%u", v.value_u32.value); return b;
        case SCS_VALUE_TYPE_u64:    snprintf(b, sizeof b, "%llu", (unsigned long long)v.value_u64.value); return b;
        case SCS_VALUE_TYPE_s64:    snprintf(b, sizeof b, "%lld", (long long)v.value_s64.value); return b;
        case SCS_VALUE_TYPE_float:  snprintf(b, sizeof b, "%.4f", v.value_float.value); return b;
        case SCS_VALUE_TYPE_double: snprintf(b, sizeof b, "%.4f", v.value_double.value); return b;
        case SCS_VALUE_TYPE_string: return esc(v.value_string.value);
        default: return "null";
    }
}

// Attributs d'une configuration ou d'un évènement -> objet JSON (uniquement l'index 0 / non indexés)
static std::string attrsJson(const scs_named_value_t *a) {
    std::string o = "{";
    bool first = true;
    for (; a && a->name; ++a) {
        if (a->index != SCS_U32_NIL && a->index != 0) continue;
        std::string val = valueJson(a->value);
        if (val == "null") continue;
        if (!first) o += ",";
        o += esc(a->name) + ":" + val;
        first = false;
    }
    return o + "}";
}

static void sendRaw(const std::string &msg) {
    if (sock == INVALID_SOCKET) return;
    sendto(sock, msg.c_str(), (int)msg.size(), 0, (sockaddr *)&appAddr, sizeof appAddr);
}

// Vrai si la fenêtre au premier plan appartient au jeu (sinon : Alt+Tab, bureau, autre appli)
static bool gameFocused() {
    HWND w = GetForegroundWindow();
    if (!w) return false;
    DWORD pid = 0;
    GetWindowThreadProcessId(w, &pid);
    return pid == GetCurrentProcessId() && !IsIconic(w);
}

static void sendState() {
    char b[1100];
    snprintf(b, sizeof b,
        "{\"type\":\"state\",\"plugin\":\"" PLUGIN_VERSION "\",\"game\":%s,\"gameVersion\":%u,\"paused\":%s,\"focused\":%s,"
        "\"speed\":%.3f,\"odometer\":%.4f,\"x\":%.2f,\"y\":%.2f,\"z\":%.2f,\"heading\":%.4f,"
        "\"navDistance\":%.1f,\"navTime\":%.1f,\"speedLimit\":%.3f,\"fuel\":%.2f,\"fuelRange\":%.1f,"
        "\"cargoDamage\":%.4f,\"gameTime\":%u,\"restStop\":%d,\"trailerConnected\":%s,\"engine\":%s,\"parkingBrake\":%s,",
        esc(gameId.c_str()).c_str(), gameVersion, paused ? "true" : "false", gameFocused() ? "true" : "false",
        t.speed, t.odometer, t.x, t.y, t.z, t.heading,
        t.navDistance, t.navTime, t.speedLimit, t.fuel, t.fuelRange,
        t.cargoDamage, t.gameTime, t.restStop,
        t.trailerConnected ? "true" : "false", t.engine ? "true" : "false", t.parkingBrake ? "true" : "false");
    std::string msg = b;
    char scale[80]; snprintf(scale, sizeof scale, "\"localScale\":%.4f,", t.localScale);
    msg += scale;
    msg += "\"busJob\":" + busJobJson + ",";
    msg += "\"truck\":" + truckJson + ",\"trailer\":" + trailerJson + ",\"job\":" + jobJson + "}";
    sendRaw(msg);
}

// Configuration bus : attributs indexés conservés dans des objets à clés numériques.
static std::string indexedAttrsJson(const scs_named_value_t *a) {
    std::map<std::string, std::string> scalar;
    std::map<std::string, std::map<unsigned, std::string>> indexed;
    for (; a && a->name; ++a) {
        if (a->index == SCS_U32_NIL) scalar[a->name] = valueJson(a->value);
        else indexed[a->name][a->index] = valueJson(a->value);
    }
    for (const auto &field : indexed) {
        std::string values = "{";
        for (const auto &item : field.second) {
            if (values.size() > 1) values += ",";
            values += esc(std::to_string(item.first).c_str()) + ":" + item.second;
        }
        scalar[field.first] = values + "}";
    }
    std::string out = "{";
    for (const auto &field : scalar) {
        if (out.size() > 1) out += ",";
        out += esc(field.first.c_str()) + ":" + field.second;
    }
    return out + "}";
}
// ---------------------------------------------------------------- callbacks
SCSAPI_VOID on_frame_end(const scs_event_t, const void *const, const scs_context_t) {
    ULONGLONG now = GetTickCount64();
    if (now - lastSend >= 100) { lastSend = now; sendState(); }
}

SCSAPI_VOID on_pause(const scs_event_t event, const void *const, const scs_context_t) {
    paused = (event == SCS_TELEMETRY_EVENT_paused);
    sendState();
}

SCSAPI_VOID on_configuration(const scs_event_t, const void *const event_info, const scs_context_t) {
    const scs_telemetry_configuration_t *info = static_cast<const scs_telemetry_configuration_t *>(event_info);
    if (!info || !info->id) return;
    std::string id = info->id;
    bool empty = !info->attributes || !info->attributes->name;
    std::string attrs = empty ? "null" : attrsJson(info->attributes);
    if (id == "bus_job") { busJobJson = empty ? "null" : indexedAttrsJson(info->attributes); sendState(); return; }
    if (id == SCS_TELEMETRY_CONFIG_truck) truckJson = attrs;
    else if (id == SCS_TELEMETRY_CONFIG_job) jobJson = attrs;
    else if (id == "trailer.0" || id == SCS_TELEMETRY_CONFIG_trailer) trailerJson = attrs;
    else return;
    sendRaw("{\"type\":\"config\",\"id\":" + esc(id.c_str()) + ",\"data\":" + attrs + "}");
    sendState();
}

SCSAPI_VOID on_gameplay(const scs_event_t, const void *const event_info, const scs_context_t) {
    const scs_telemetry_gameplay_event_t *info = static_cast<const scs_telemetry_gameplay_event_t *>(event_info);
    if (!info || !info->id) return;
    char b[160];
    snprintf(b, sizeof b, ",\"odometer\":%.4f}", t.odometer);
    sendRaw("{\"type\":\"gameplay\",\"id\":" + esc(info->id) + ",\"data\":" + attrsJson(info->attributes) + b);
}

// Channels
SCSAPI_VOID store_float(const scs_string_t, const scs_u32_t, const scs_value_t *const v, const scs_context_t ctx) {
    *static_cast<float *>(ctx) = v ? v->value_float.value : 0.0f;
}
SCSAPI_VOID store_bool(const scs_string_t, const scs_u32_t, const scs_value_t *const v, const scs_context_t ctx) {
    *static_cast<bool *>(ctx) = v ? (v->value_bool.value != 0) : false;
}
SCSAPI_VOID store_u32(const scs_string_t, const scs_u32_t, const scs_value_t *const v, const scs_context_t ctx) {
    *static_cast<unsigned *>(ctx) = v ? v->value_u32.value : 0;
}
SCSAPI_VOID store_s32(const scs_string_t, const scs_u32_t, const scs_value_t *const v, const scs_context_t ctx) {
    *static_cast<int *>(ctx) = v ? v->value_s32.value : 0;
}
SCSAPI_VOID store_placement(const scs_string_t, const scs_u32_t, const scs_value_t *const v, const scs_context_t) {
    if (!v) return;
    t.x = v->value_dplacement.position.x;
    t.y = v->value_dplacement.position.y;
    t.z = v->value_dplacement.position.z;
    t.heading = v->value_dplacement.orientation.heading;
}

// ---------------------------------------------------------------- init / shutdown
SCSAPI_RESULT scs_telemetry_init(const scs_u32_t version, const scs_telemetry_init_params_t *const params) {
    if (version != SCS_TELEMETRY_VERSION_1_00 && version != SCS_TELEMETRY_VERSION_1_01) return SCS_RESULT_unsupported;
    const scs_telemetry_init_params_v100_t *const p = static_cast<const scs_telemetry_init_params_v100_t *>(params);

    gameLog = p->common.log;
    gameId = p->common.game_id ? p->common.game_id : "";
    gameVersion = p->common.game_version;
    if (gameId != SCS_GAME_ID_EUT2 && gameId != SCS_GAME_ID_ATS) {
        if (gameLog) gameLog(SCS_LOG_TYPE_warning, "[Telemetrie Entreprise] Jeu non pris en charge.");
        return SCS_RESULT_unsupported;
    }

    WSADATA wsa;
    if (WSAStartup(MAKEWORD(2, 2), &wsa) == 0) {
        sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (sock != INVALID_SOCKET) { u_long nb = 1; ioctlsocket(sock, FIONBIO, &nb); }
        memset(&appAddr, 0, sizeof appAddr);
        appAddr.sin_family = AF_INET;
        appAddr.sin_port = htons(APP_PORT);
        appAddr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    }

    auto ev = p->register_for_event;
    ev(SCS_TELEMETRY_EVENT_frame_end, on_frame_end, nullptr);
    ev(SCS_TELEMETRY_EVENT_paused, on_pause, nullptr);
    ev(SCS_TELEMETRY_EVENT_started, on_pause, nullptr);
    ev(SCS_TELEMETRY_EVENT_configuration, on_configuration, nullptr);
    ev(SCS_TELEMETRY_EVENT_gameplay, on_gameplay, nullptr);   // jeux >= 1.35 ; ignoré sinon

    auto ch = p->register_for_channel;
    const scs_u32_t N = SCS_U32_NIL, F = SCS_TELEMETRY_CHANNEL_FLAG_none;
    ch(SCS_TELEMETRY_CHANNEL_local_scale, N, SCS_VALUE_TYPE_float, F, store_float, &t.localScale);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_speed, N, SCS_VALUE_TYPE_float, F, store_float, &t.speed);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_odometer, N, SCS_VALUE_TYPE_float, F, store_float, &t.odometer);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_world_placement, N, SCS_VALUE_TYPE_dplacement, F, store_placement, nullptr);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_navigation_distance, N, SCS_VALUE_TYPE_float, F, store_float, &t.navDistance);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_navigation_time, N, SCS_VALUE_TYPE_float, F, store_float, &t.navTime);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_navigation_speed_limit, N, SCS_VALUE_TYPE_float, F, store_float, &t.speedLimit);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_fuel, N, SCS_VALUE_TYPE_float, F, store_float, &t.fuel);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_fuel_range, N, SCS_VALUE_TYPE_float, F, store_float, &t.fuelRange);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_engine_enabled, N, SCS_VALUE_TYPE_bool, F, store_bool, &t.engine);
    ch(SCS_TELEMETRY_TRUCK_CHANNEL_parking_brake, N, SCS_VALUE_TYPE_bool, F, store_bool, &t.parkingBrake);
    ch(SCS_TELEMETRY_JOB_CHANNEL_cargo_damage, N, SCS_VALUE_TYPE_float, F, store_float, &t.cargoDamage);
    ch(SCS_TELEMETRY_CHANNEL_game_time, N, SCS_VALUE_TYPE_u32, F, store_u32, &t.gameTime);
    ch(SCS_TELEMETRY_CHANNEL_next_rest_stop, N, SCS_VALUE_TYPE_s32, F, store_s32, &t.restStop);
    // Remorque : nouveau nom (multi-remorques) puis ancien nom pour les vieilles versions du jeu
    if (ch("trailer.0.connected", N, SCS_VALUE_TYPE_bool, F, store_bool, &t.trailerConnected) != SCS_RESULT_ok)
        ch(SCS_TELEMETRY_TRAILER_CHANNEL_connected, N, SCS_VALUE_TYPE_bool, F, store_bool, &t.trailerConnected);

    if (gameLog) gameLog(SCS_LOG_TYPE_message, "[Telemetrie Entreprise] Plugin " PLUGIN_VERSION " charge.");
    return SCS_RESULT_ok;
}

SCSAPI_VOID scs_telemetry_shutdown(void) {
    sendRaw("{\"type\":\"shutdown\"}");
    if (sock != INVALID_SOCKET) { closesocket(sock); sock = INVALID_SOCKET; }
    WSACleanup();
}

BOOL APIENTRY DllMain(HMODULE, DWORD, LPVOID) { return TRUE; }
