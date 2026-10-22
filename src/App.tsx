"use client";
import DeleteMemoryDialog from "./components/DeleteMemoryDialog";

import Chat from "./components/Chat";
import CommunityControls from "./components/CommunityControls";
import GroupInfoModal from "./components/GroupInfoModal";
import { filterCommunity } from "./groups";
import { createGroup as createRemoteGroup, createGroupMemory, getGroupMemories, getGroups, joinGroup as joinRemoteGroup, type CreateGroupInput, type GroupMember } from "./groupsApi";
import type { CommunityGroup } from "./types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, Plus, X, Newspaper, MessageCircle, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  categories,
  filterMemories,
  symbols,
  type Achievement,
  type Category,
  type Decade,
  type Memory,
  type Period,
  type TierProgress,
} from "./types";
import { achievements, eraContent, resolveUserCategory } from "./data";
import { totalGivenNostalgia, updateNostalgiaRating, type NostalgiaRatings } from "./nostalgiaRatings";
import { isOwnMemory, eliminarPublicacion } from "./api";
import { ratePublication } from "./publicationsApi";
import { getPerfilUsuario, getPublicacionesUsuario, type UsuarioBusqueda, type UsuarioPerfil } from "./userApi";
import AuthMenu from "./components/auth/AuthMenu";
import UserSearch from "./components/UserSearch";
import { useAuth } from "./components/auth/AuthProvider";
import AchievementToast from "./components/AchievementToast";
import MapModal from "./components/MapModal";
import MainMap from "./components/MainMap";
import Profile from "./components/profile/Profile";
import SocialFeed from "./components/social/SocialFeed";
import type { FeedTab } from "./socialTypes";
import EraTimeline from "./components/EraTimeline";
import { flushSync } from "react-dom";
import MemoryMap, { type Point } from "./components/MemoryMap";
import MemoryForm from "./components/MemoryForm";
import SidePanel from "./components/SidePanel";
import Player from "./components/Player";
import EraFacts from "./components/EraFacts";
import EraChrome, { EraIcon } from "./components/EraChrome";
import { availableDecades } from "./eras/registry";
import { eraThemes } from "./themes";
import { readNavigation, navigationUrl } from './navigationState';

import { getMapPublications, getPublication, publicationId, type MapBounds } from './publicationsApi';
import { dejarDeSeguir, getSeguidores, getSeguidos, seguir, type FollowedUser } from './seguimientosApi';

export default function App() {
  const router = useRouter();
  const { session, status: authStatus } = useAuth();
  const [initialNavigation] = useState(() => readNavigation(window.location.search));
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const reportBounds = useCallback((next: MapBounds) => setBounds(current => JSON.stringify(current) === JSON.stringify(next) ? current : next), []);
  const [remotePins, setRemotePins] = useState<Memory[]>([]);
  const [feedItems, setFeedItems] = useState<Memory[]>([]);
  const [remoteSelected, setRemoteSelected] = useState<Memory | null>(null);
  const selectedSeed = useRef<Memory | null>(null);
  const [apiStatus, setApiStatus] = useState('');
  const [mapRevision, setMapRevision] = useState(0);
  const [groups,setGroups] = useState<CommunityGroup[]>([]);
  const myGroups = groups.filter(group => group.isMember);
  const [scope,setScope] = useState('all');
  const [query,setQuery] = useState('');
  const [publishingGroupId,setPublishingGroupId] = useState<string | null>(null);
  const [groupInfoId,setGroupInfoId] = useState<string | null>(null);
  const mobileOptions = useRef<HTMLDialogElement>(null);
  const mobileOptionsTrigger = useRef<HTMLButtonElement>(null);
  const mapExpandButton = useRef<HTMLButtonElement>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<FollowedUser[]>([]);
  const [followers, setFollowers] = useState<FollowedUser[]>([]);
  const [followingRevision, setFollowingRevision] = useState(0);
  const pendingFollows = useRef(new Set<number>());
  const creationOrigin = useRef(false);
  const [profileAuthor, setProfileAuthor] = useState<string | null>(initialNavigation.profileAuthor);
  const [view, setView] = useState<"map" | "feed" | "profile" | "chat">(initialNavigation.view);
  useEffect(() => {
    if (authStatus !== 'loading' && !session && (view === "chat" || view === "profile")) setView("feed");
  }, [session, view, authStatus]);
  const [period, setPeriod] = useState<Period>(initialNavigation.period);
  const [category, setCategory] = useState<Category | "Todas">(initialNavigation.category);
  const [dbMemories, setDbMemories] = useState<Memory[]>([]);
  const [groupMemories, setGroupMemories] = useState<Memory[]>([]);
  const [repostedPublicationIds, setRepostedPublicationIds] = useState<string[]>([]);
  const [groupOpenRequest, setGroupOpenRequest] = useState(0);
  const [profileMemories, setProfileMemories] = useState<Memory[]>([]);
  const [profileUser, setProfileUser] = useState<UsuarioPerfil | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const currentUserId = session?.usuarioId;
  const following = followingUsers.map(user => user.username);
  const [chatearCon, setChatearCon] = useState<{ usuarioId: number; username: string; ts: number } | null>(null);

  useEffect(() => {
    if (view !== 'profile') return;
    const targetUsername = profileAuthor ?? session?.username;
    if (!targetUsername) return;

    const controller = new AbortController();
    setProfileLoading(true);

    getPerfilUsuario(targetUsername, controller.signal)
      .then(async (perfil) => {
        if (controller.signal.aborted) return;
        setProfileUser(perfil);
        const userMems = await getPublicacionesUsuario(perfil.id, controller.signal);
        if (controller.signal.aborted) return;
        setProfileMemories(userMems);
        setProfileLoading(false);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setProfileLoading(false);
          setNotice(error instanceof Error ? error.message : 'No se pudo cargar el perfil del usuario.');
        }
      });

    return () => controller.abort();
  }, [view, profileAuthor, session?.username]);

  useEffect(() => {
    const controller = new AbortController();
    setFollowingUsers([]);
    setFollowers([]);
    if (!currentUserId) return () => controller.abort();
    Promise.all([getSeguidos(currentUserId, controller.signal), getSeguidores(currentUserId, controller.signal)])
      .then(([nextFollowing, nextFollowers]) => {
        if (!controller.signal.aborted) { setFollowingUsers(nextFollowing); setFollowers(nextFollowers); }
      })
      .catch(error => { if (!controller.signal.aborted) setNotice(`No se pudieron cargar los seguimientos: ${error.message}`); });
    return () => controller.abort();
  }, [currentUserId]);

  async function toggleFollow(author: string, authorId?: number) {
    if (!currentUserId) {
      router.push("/auth/login?returnTo=/explorar");
      return;
    }
    const targetId = authorId ?? [...feedItems, ...dbMemories].find(memory => memory.author === author)?.authorId;
    if (!targetId) { setNotice(`No se puede seguir a ${author}: falta su identificador de usuario.`); return; }
    if (targetId === currentUserId || pendingFollows.current.has(targetId)) return;
    const wasFollowing = followingUsers.some(user => user.id === targetId);
    pendingFollows.current.add(targetId);
    try {
      if (wasFollowing) {
        await dejarDeSeguir(currentUserId, targetId);
        setFollowingUsers(current => current.filter(user => user.id !== targetId));
      } else {
        await seguir(currentUserId, targetId);
        setFollowingUsers(current => [...current, { id: targetId, username: author }]);
      }
      setProfileUser(current => current?.id === targetId ? {
        ...current,
        loSigo: !wasFollowing,
        cantidadSeguidores: Math.max(0, current.cantidadSeguidores + (wasFollowing ? -1 : 1)),
      } : current);
      setFollowingRevision(revision => revision + 1);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'No se pudo actualizar el seguimiento.');
    } finally {
      pendingFollows.current.delete(targetId);
    }
  }

  const [selectedId, setSelectedId] = useState<string | null>(initialNavigation.selectedId);
  const [picking, setPicking] = useState(false);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [draft, setDraft] = useState<Point | null>(null);
  const [draftHashtags, setDraftHashtags] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    getGroups(controller.signal)
      .then(remoteGroups => {
        if (!controller.signal.aborted) setGroups(remoteGroups);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setNotice(error instanceof Error ? error.message : 'No se pudieron cargar los grupos.');
        }
      });
    return () => controller.abort();
  }, [session]);
  useEffect(() => {
    const activeGroup = groups.find(group => group.id === scope);
    setGroupMemories([]);
    if (!activeGroup) return;

    const controller = new AbortController();
    getGroupMemories(activeGroup.id, controller.signal)
      .then(memories => {
        if (!controller.signal.aborted) setGroupMemories(memories);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setNotice(error instanceof Error ? error.message : 'No se pudieron cargar los recuerdos del grupo.');
        }
      });
    return () => controller.abort();
  }, [groups, scope]);
  const [celebrating, setCelebrating] = useState<Achievement | null>(null);
  const [ratings, setRatings] = useState<NostalgiaRatings>({});
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});
  const [firstFiveEarned, setFirstFiveEarned] = useState(false);
  const earned: Achievement[] = [
    ...(dbMemories.some(m => isOwnMemory(m)) ? [achievements[0]] : []),
    ...(firstFiveEarned ? [achievements.find(achievement => achievement.id === '21')!] : []),
  ];
  const tierProgress: TierProgress = {
    memories: profileUser?.cantidadPublicaciones ?? profileMemories.length,
    points: profileUser?.puntosNostalgia ?? Math.max(0, ...profileMemories.map(m => pointsMap[m.id] ?? m.points ?? 0)),
    subscribed: false,
  };
  const canRate = (profileUser?.reputacion ?? resolveUserCategory(tierProgress)) !== 'Errante';
  async function rateMemory(postId: string, score: number) {
    if (!currentUserId) {
      router.push("/auth/login?returnTo=/explorar");
      return;
    }
    if (!canRate) {
      setNotice('Disponible desde la categoría Nostálgico.');
      return;
    }
    const previousRating = ratings[postId];
    const next = updateNostalgiaRating(ratings, postId, score);
    setRatings(next);
    if (!firstFiveEarned && totalGivenNostalgia(next) >= 5) {
      setFirstFiveEarned(true);
      setCelebrating(achievements.find(achievement => achievement.id === '21')!);
    }

    try {
      const res = await ratePublication(postId, score);
      setPointsMap(current => ({
        ...current,
        [postId]: res.puntosTotales,
      }));
      if (res.miPuntuacion === null || res.miPuntuacion === undefined) {
        setRatings(current => {
          const updated = { ...current };
          delete updated[postId];
          return updated;
        });
      } else {
        setRatings(current => ({
          ...current,
          [postId]: res.miPuntuacion!,
        }));
      }

      const updateMem = (m: Memory): Memory =>
        m.id === postId
          ? {
              ...m,
              points: res.puntosTotales,
              viewerRating: res.miPuntuacion ?? undefined,
            }
          : m;

      setDbMemories(current => current.map(updateMem));
      setGroupMemories(current => current.map(updateMem));
      setProfileMemories(current => current.map(updateMem));
    } catch (error) {
      setRatings(current => {
        const reverted = { ...current };
        if (previousRating !== undefined) reverted[postId] = previousRating;
        else delete reverted[postId];
        return reverted;
      });
      setNotice(error instanceof Error ? error.message : 'No se pudo registrar la puntuación.');
    }
  }
  const [panelOpen, setPanelOpen] = useState(initialNavigation.panelOpen);
  const [factsOpen, setFactsOpen] = useState(initialNavigation.factsOpen);
  useEffect(() => {
    const url = navigationUrl(window.location.href, { period, view, selectedId, profileAuthor, category, panelOpen, factsOpen });
    window.history.replaceState(window.history.state, '', url);
  }, [period, view, selectedId, profileAuthor, category, panelOpen, factsOpen]);
  useEffect(() => {
    const restore = () => {
      const next = readNavigation(window.location.search);
      setPeriod(next.period); setView(next.view); setSelectedId(next.selectedId);
      setProfileAuthor(next.profileAuthor); setCategory(next.category);
      setPanelOpen(next.panelOpen); setFactsOpen(next.factsOpen);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  const [musicOpen, setMusicOpen] = useState(false);
  useEffect(() => { setMusicOpen(window.innerWidth >= 900); }, []);
  const addButton = useRef<HTMLButtonElement>(null);
  const storiesButton = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const closeMenus = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      document
        .querySelectorAll<HTMLDetailsElement>(".compact-menu[open]")
        .forEach((menu) => {
          if (
            event instanceof KeyboardEvent ||
            !menu.contains(event.target as Node)
          )
            menu.open = false;
        });
    };
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", closeMenus);
    return () => {
      document.removeEventListener("click", closeMenus);
      document.removeEventListener("keydown", closeMenus);
    };
  }, []);
  useEffect(() => {
    if (!bounds || view !== 'map') return;
    const controller = new AbortController();
    setApiStatus('');
    const loadingTimer = setTimeout(() => setApiStatus('Actualizando publicaciones…'), 1000);
    const timer = setTimeout(() => {
      getMapPublications(bounds, period, category, controller.signal).then(result => {
        if (controller.signal.aborted) return;
        clearTimeout(loadingTimer);
        setRemotePins(result.memories);
        setApiStatus(result.hayMas ? 'Hay más publicaciones: acercá el mapa para verlas.' : '');
      }).catch(error => { if (!controller.signal.aborted) { clearTimeout(loadingTimer); setApiStatus(`No se pudieron cargar las publicaciones: ${error.message}`); } });
    }, 300);
    return () => { clearTimeout(timer); clearTimeout(loadingTimer); controller.abort(); };
  }, [bounds, period, category, view, mapRevision]);
  useEffect(() => {
    setRemoteSelected(current => current?.id === selectedId ? current : null);
    if (!selectedId || authStatus === 'loading') return;
    const pin = [selectedSeed.current, remoteSelected, ...remotePins, ...dbMemories].find(memory => memory?.id === selectedId);
    if (pin ? !publicationId(pin) : !/^[1-9]\d*$/.test(selectedId)) return;
    const controller = new AbortController();
    setApiStatus(view === 'map' ? 'Cargando resumen…' : 'Cargando publicación…');
    getPublication(pin ?? selectedId, view === 'map', controller.signal).then(memory => {
      if (controller.signal.aborted) return;
      setRemoteSelected(memory); setApiStatus('');
    }).catch(error => { if (!controller.signal.aborted) { setRemoteSelected(null); setApiStatus(`No se pudo abrir la publicación: ${error.message}`); } });
    return () => controller.abort();
  }, [selectedId, view, mapRevision, authStatus]);
  const viewingGroup = groups.some(group => group.id === scope);
  const communityMemories = viewingGroup ? groupMemories : dbMemories;
  const feedSource = viewingGroup ? groupMemories : feedItems;
  const memories = filterMemories(
    filterCommunity(view === 'map' ? remotePins : view === 'feed' ? feedSource : dbMemories,view === "map" ? "all" : scope,groups,view === "map" ? "" : query),
    period,
    category
  );
  const visibleMemories = view === "profile" ? profileMemories : memories;
  const selected = remoteSelected?.id === selectedId ? remoteSelected : visibleMemories.find((m) => m.id === selectedId) ?? remotePins.find(m => m.id === selectedId) ?? null;
  function chooseScope(value:string) {
    setScope(value);setQuery('');setSelectedId(null);
    const group=groups.find(g=>g.id===value);
    if(group){setPeriod({decade:group.decade,year:null});setCategory('Todas');}
    setPanelOpen(false);
  }
  async function createGroup(group:CreateGroupInput): Promise<string | null> {
    if(groups.some(g=>g.name.toLocaleLowerCase()===group.name.toLocaleLowerCase())) return 'Ya existe un grupo con ese nombre.';
    try {
      const created = await createRemoteGroup(group);
      setGroups(current => [...current, created]);setScope(created.id);setSelectedId(null);setQuery('');setCategory('Todas');setPeriod({decade:created.decade,year:null});return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo crear el grupo.';
    }
  }
  async function joinGroup(groupId:string): Promise<string | null> {
    try {
      await joinRemoteGroup(groupId);
      setGroups(current => current.map(group => group.id === groupId ? {...group,isMember:true} : group));
      setNotice('Ya sos integrante del grupo.');
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No se pudo completar la unión al grupo.';
    }
  }
  function groupUpdated(updated:CommunityGroup) {
    setGroups(current=>current.map(group=>group.id===updated.id?updated:group));
    if(scope===updated.id)setPeriod({decade:updated.decade,year:null});
  }
  function groupRemoved(groupId:string, message:string) {
    setGroups(current=>current.filter(group=>group.id!==groupId));
    setGroupMemories([]);setGroupInfoId(null);setScope('groups');setSelectedId(null);setQuery('');setNotice(message);
  }
  const communityControls = (profile=false) => <CommunityControls groups={myGroups} searchGroups={groups} scope={scope} query={query} decade={period.decade} profile={profile} canCreate={!!session} onQuery={value=>{setQuery(value);setSelectedId(null);}} onScope={value=>{chooseScope(value);if(profile){setGroupOpenRequest(current=>current+1);setView('feed');}}} onCreate={createGroup} onJoinGroup={joinGroup} onAddToGroup={startAddingToGroup} onShowInfo={setGroupInfoId}/>;
  const eraTransition = useRef<ViewTransition | null>(null);
  useEffect(() => () => { eraTransition.current?.skipTransition(); }, []);
  function changePeriod(next: Period, afterChange?: () => void) {
    if (next.decade === period.decade && next.year === period.year) { afterChange?.(); return; }
    const update = () => { applyPeriod(next); afterChange?.(); };
    if (next.decade === period.decade || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); return; }
    if (document.startViewTransition) {
      eraTransition.current?.skipTransition();
      document.documentElement.classList.add("switching-era");
      const transition = document.startViewTransition(() => flushSync(update));
      eraTransition.current = transition;
      void transition.finished.catch(() => {}).finally(() => {
        if (eraTransition.current === transition) {
          document.documentElement.classList.remove("switching-era");
          eraTransition.current = null;
        }
      });
    } else {
      flushSync(update);
      document.querySelector(".app")?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 600, easing: "ease-out" });
    }
  }
  function applyPeriod(next: Period) {
    setPeriod(next);
    if(groups.some(g=>g.id===scope && g.decade!==next.decade)) setScope("all");
    setSelectedId(null);
    setFactsOpen(false);
    setPanelOpen(false);
  }
  async function iniciarChatConUsuario(username: string) {
    try {
      const { obtenerUsuarioPorUsername } = await import("./chat/chatApi");
      const usuario = await obtenerUsuarioPorUsername(username);
      setChatearCon({ usuarioId: usuario.usuarioId, username: usuario.username, ts: Date.now() });
      setView("chat");
      setPanelOpen(false);
      setFactsOpen(false);
      setPicking(false);
      setSelectedId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar el chat.";
      setNotice(msg);
    }
  }

  function openProfile(memory: Memory) {
    setProfileAuthor(isOwnMemory(memory) ? null : memory.author);
    setSelectedId(null); setPanelOpen(false); setFactsOpen(false); setPicking(false);
    setCategory("Todas"); setPeriod(p => ({...p, year: null}));
    setView("profile");
  }
  function openMemberProfile(member:GroupMember) {
    setGroupInfoId(null);
    setProfileAuthor(member.id===currentUserId?null:member.username);
    setSelectedId(null);setPanelOpen(false);setFactsOpen(false);setPicking(false);
    setCategory("Todas");setPeriod(current=>({...current,year:null}));setView("profile");
  }
  function openSearchedUserProfile(user: UsuarioBusqueda) {
    setProfileAuthor(user.id === currentUserId ? null : user.username);
    setSelectedId(null);setPanelOpen(false);setFactsOpen(false);setPicking(false);
    setCategory("Todas");setPeriod(current => ({...current, year: null}));setView("profile");
  }
  function openPublication(memory: Memory) {
    selectedSeed.current = memory;
    setPeriod({decade: Math.floor(memory.year / 10) * 10 as Decade, year: null});setCategory("Todas");
    setScope('all');setQuery('');setSelectedId(memory.id);setPanelOpen(false);setMapExpanded(false);setView('feed');
  }
  function select(memory: Memory) {
    selectedSeed.current = memory;
    setRemoteSelected(memory);
    setSelectedId(memory.id);
    setPanelOpen(false);
    if (window.innerWidth < 900) {
      setFactsOpen(false);
    }
  }
  function selectRelatedMemory(memory: Memory) {
    const decade = Math.floor(memory.year / 10) * 10 as Decade;
    if (!availableDecades.includes(decade)) {
      setNotice('Este recuerdo pertenece a una década que todavía no está disponible en el mapa.');
      return;
    }
    changePeriod({ decade, year: null }, () => {
      setCategory('Todas');
      select(memory);
    });
  }
  function closeStories() {
    setPanelOpen(false);
    setSelectedId(null);
    storiesButton.current?.focus();
  }
  function beginAdding(groupId: string | null) {
    if (!session) {
      router.push("/auth/login?returnTo=/explorar");
      return;
    }
    setPublishingGroupId(groupId);
    setDraftHashtags([]);
    creationOrigin.current = view === "profile";
    setProfileAuthor(null);
    setView("map");
    setPicking(true);
    setSelectedId(null);
    setPanelOpen(false);
    setFactsOpen(false);
    setMusicOpen(false);
  }
  function startAdding() {
    beginAdding(null);
  }
  function startAddingToGroup(groupId: string) {
    const group = myGroups.find(candidate => candidate.id === groupId);
    if (!group) return;
    setScope(group.id);
    setPeriod({ decade: group.decade, year: null });
    setCategory('Todas');
    beginAdding(group.id);
  }
  function cancel() {
    if (draftHashtags.length) setView("feed");
    if (creationOrigin.current) setView("profile");
    setPicking(false);
    setDraft(null);
    setPublishingGroupId(null);
    window.setTimeout(() => addButton.current?.focus(), 0);
  }
  useEffect(() => {
    if (draft || mapExpanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (picking) cancel();
      else if (panelOpen) closeStories();
      else {
        setFactsOpen(false);
        setMusicOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [picking, panelOpen, draft, mapExpanded]);
  function editMemory(memory: Memory) {
    if (isOwnMemory(memory)) setEditing(memory);
  }
  function deleteMemory(memory: Memory) {
    setDeleting(memory);
  }
  function confirmDelete(memory: Memory): string | null {
    eliminarPublicacion(memory.id)
      .then(() => {
        setMapRevision(value => value + 1);
        setRemoteSelected(current => current?.id === memory.id ? null : current);
      })
      .catch((err) =>
        console.warn("Backend falló al eliminar publicación:", err)
      );

    setDbMemories(prev => prev.filter(m => m.id !== memory.id));
    setProfileMemories(prev => prev.filter(m => m.id !== memory.id));
    if (selectedId === memory.id) setSelectedId(null);
    setNotice("Recuerdo eliminado.");
    return null;
  }
  function saveEdit(memory: Memory): string | null {
    const original = [...dbMemories, ...profileMemories].find(m => m.id === editing?.id);
    if (!original) return "Este recuerdo ya no está disponible.";
    const group = groups.find(g => g.id === original.groupId);
    if (group && (memory.year < group.decade || memory.year > group.decade + 9)) return `Elegí un año entre ${group.decade} y ${group.decade + 9} para este grupo.`;
    const updated = {...memory, id: original.id, groupId: original.groupId, source: original.source, author: original.author};
    setDbMemories(prev => prev.map(m => m.id === original.id ? updated : m));
    setProfileMemories(prev => prev.map(m => m.id === original.id ? updated : m));
    setEditing(null);
    setPeriod({decade: Math.floor(memory.year / 10) * 10 as Decade, year: null});setCategory("Todas");setQuery("");
    setNotice("Recuerdo actualizado.");
    return null;
  }
  async function save(memory: Memory) {
    const destinationGroup=myGroups.find(g=>g.id===publishingGroupId);
    if(destinationGroup) {
      if(memory.year < destinationGroup.decade || memory.year > destinationGroup.decade+9) return `Elegí un año entre ${destinationGroup.decade} y ${destinationGroup.decade+9} para este grupo.`;
      memory={...memory,groupId:destinationGroup.id};
    }
    const isFirstMemory = dbMemories.filter(m => isOwnMemory(m)).length === 0;

    try {
      const res = destinationGroup
        ? await createGroupMemory(destinationGroup.id, memory)
        : await import("./api").then(({ crearPublicacion }) => crearPublicacion(memory));
      if (res && res.id) {
        memory = { ...memory, id: res.id.toString(), source: 'backend' };
      }
      setDbMemories(current => [memory, ...current.filter(item => item.id !== memory.id)]);
      setProfileMemories(current => [memory, ...current.filter(item => item.id !== memory.id)]);
      if (destinationGroup) {
        setGroupMemories(current => [memory, ...current.filter(item => item.id !== memory.id)]);
        try {
          setGroupMemories(await getGroupMemories(destinationGroup.id));
        } catch (refreshError) {
          console.warn("El recuerdo se guardÃ³, pero no se pudo refrescar el grupo.", refreshError);
        }
      }
    } catch (err) {
      console.warn("Backend falló al crear publicación.", err);
      return err instanceof Error
        ? err.message
        : "Falló la conexión con el servidor. No se pudo guardar el recuerdo.";
    }

    setMapRevision(value => value + 1);
    setPeriod({
      decade: (Math.floor(memory.year / 10) * 10) as Decade,
      year: null,
    });
    setCategory("Todas");
    setDraft(null);
    setPicking(false);
    setPublishingGroupId(null);
    select(memory);
    if (creationOrigin.current) {
      setView("profile");
      setPanelOpen(false);
    }
    if (draftHashtags.length) {
      setView("feed"); setSelectedId(null); setPanelOpen(false); setQuery("");
      setDraftHashtags([]);
    }
    setNotice("¡Recuerdo guardado! Ya tiene su lugar en el mapa.");
    // Hardcoded unlock: the very first memory the visitor creates earns badge 01.
    // It only sets this state, so the popup never moves them off the current view.
    if (isFirstMemory) setCelebrating(achievements[0]);
    window.setTimeout(() => addButton.current?.focus(), 0);
    return null;
  }
  function navigate(destination: "map" | "stories" | "facts" | "music") {
    setPicking(false);
    if (destination === "music") {
      setMusicOpen(!musicOpen);
      if (window.innerWidth < 900) { setPanelOpen(false); setFactsOpen(false); }
      return;
    }
    if (destination === "stories") storiesButton.current = document.activeElement as HTMLElement | null;
    setView("map");
    setPanelOpen(destination === "stories" && (view !== "map" || !panelOpen));
    setFactsOpen(destination === "facts" && (view !== "map" || !factsOpen));
    if (destination === "map") setSelectedId(null);
  }
  function openOwnProfile() {
    setProfileAuthor(null);
    setView("profile");
    setMusicOpen(false);
    setSelectedId(null);
    setPanelOpen(false);
    setFactsOpen(false);
    setPicking(false);
  }
  const theme = eraThemes[period.decade];
  const groupInfo = groups.find(group=>group.id===groupInfoId) ?? null;
  return (
    <div
      style={theme.tokens}
      className={`app map-app view-${view} era-${period.decade} ${panelOpen ? "stories-open" : ""} ${musicOpen ? "music-open" : ""}`}
    >
      <EraTimeline period={period} onChange={changePeriod} action={
        <button
          ref={addButton}
          aria-label="Recordar"
          className="primary-button time-add-memory"
          onClick={startAdding}
          disabled={picking || !!draft}
        >
          <Plus size={16} />
          <span>Recordar</span>
        </button>
      }/>
      <div className="mobile-appbar">
        <div className="mobile-page-title"><span>Nostalgiar</span><strong>{view === 'map' ? 'Explorar' : view === 'feed' ? 'Feed' : view === 'chat' ? 'Chat' : 'Mi perfil'}</strong></div>
        <button ref={mobileOptionsTrigger} className="mobile-era-button" onClick={() => mobileOptions.current?.showModal()} aria-label="Abrir opciones"><strong>Opciones</strong><ChevronDown size={15}/></button>
        <button className="mobile-add-button" aria-label="Sumar mi recuerdo" onClick={startAdding} disabled={picking || !!draft}><Plus size={23}/></button>
      </div>
      <dialog ref={mobileOptions} className="mobile-options" onClick={e=>{if(e.target===e.currentTarget)mobileOptions.current?.close();}} onClose={()=>mobileOptionsTrigger.current?.focus()} aria-labelledby="mobile-options-title">
        <header><h2 id="mobile-options-title">Opciones de exploración</h2><button className="icon-button" aria-label="Cerrar opciones" onClick={()=>mobileOptions.current?.close()}><X/></button></header>
        <label className="mobile-category">Categoría<select value={category} onChange={e=>{setCategory(e.target.value as Category | 'Todas');setSelectedId(null);}}>{['Todas',...categories].map(c=><option key={c}>{c}</option>)}</select></label>
        <div className="mobile-tools">{(['stories','facts','music'] as const).map(destination=><button key={destination} onClick={()=>{mobileOptions.current?.close();navigate(destination);}}><EraIcon decade={period.decade} destination={destination}/><span>{destination==='stories'?'Recuerdos':destination==='facts'?'Efemérides':'Música'}</span></button>)}</div>
        <button className="primary-button mobile-options-done" onClick={()=>mobileOptions.current?.close()}>Ver selección</button>
      </dialog>
      <a className="skip-link" href="#explore">
        Saltar al mapa
      </a>
        <main id="explore" className="map-canvas" style={view === 'map' ? undefined : { display: 'none' }}>
          <MainMap
            active={view === 'map'}
            showEmptyState={false}
            onBoundsChange={reportBounds}
            memories={filterMemories(remotePins, period, category)}
            selected={view === 'map' ? selected : null}
            onSelect={select}
            onSelectRelated={selectRelatedMemory}
            onOpen={openPublication}
            picking={picking}
            onPick={(point) => {
              setDraft(point);
              setPicking(false);
            }}
            draft={draft}
            onCancel={cancel}
          />
        </main>
      <EraChrome
        period={period}
        count={visibleMemories.length}
        panelOpen={panelOpen}
        factsOpen={factsOpen}
        musicOpen={musicOpen}
        onNavigate={navigate}
      />
      <nav className="navigation-rail" aria-label="Navegación principal">
        <button
          aria-label="Explorar mapa"
          className={view === "map" && !panelOpen ? "rail-active" : ""}
          onClick={() => navigate("map")}
        >
          <EraIcon decade={period.decade} destination="map" />
          <span>Explorar</span>
        </button>
        <button
          aria-current={view === "feed" ? "page" : undefined}
          className={view === "feed" ? "rail-active" : ""}
          onClick={() => {
            setView("feed");
            setSelectedId(null);
            setPanelOpen(false);
            setFactsOpen(false);
            setPicking(false);
          }}
        >
          <Newspaper />
          <span>Feed</span>
        </button>
        {session && <button aria-current={view === "chat" ? "page" : undefined} className={view === "chat" ? "rail-active" : ""} onClick={() => {
          setView("chat");setPicking(false);setPanelOpen(false);setFactsOpen(false);
        }}><MessageCircle/><span>Chat</span></button>}
        {session ? <div className="account-navigation">
          <UserSearch
            currentUserId={session.usuarioId}
            followedUsers={followingUsers}
            onFollow={toggleFollow}
            onOpenProfile={openSearchedUserProfile}
          />
          <AuthMenu profileActive={view === "profile" && profileAuthor === null} onOpenProfile={openOwnProfile} />
        </div> : <AuthMenu profileActive={false} onOpenProfile={openOwnProfile} />}
      </nav>
      <header className="map-toolbar">
        <div className="compact-selectors">
          <div id="place-search-slot" />
          <details className="filters compact-menu">
            <summary>
              {category === "Personales" ? "Recuerdos personales" : category}
              <span aria-hidden="true">...</span>
              <span className="sr-only">Elegir categoría</span>
            </summary>
            <div
              className="category-options"
              role="group"
              aria-label="Filtrar por categoría"
            >
              {(["Todas", ...categories] as const).map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? "active" : ""}
                  onClick={(event) => {
                    setCategory(c);
                    setSelectedId(null);
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                  }}
                >
                  <span aria-hidden="true">
                    {c === "Todas" ? "✳" : symbols[c]}
                  </span>
                  {c === "Personales" ? "Recuerdos personales" : c}
                </button>
              ))}
            </div>
          </details>
        </div>

      </header>

      
      {view === "map" && panelOpen && (
        <div className="stories-drawer stories-index">
          <div className="drawer-heading">
            <span className="eyebrow">{theme.storiesTitle}</span>
            <button
              className="icon-button"
              aria-label="Cerrar historias"
              onClick={closeStories}
            >
              <X size={19} />
            </button>
          </div>
          <SidePanel
            selected={selected}
            memories={memories}
            onSelect={(memory) => {
              openPublication(memory);
            }}
          />
        </div>
      )}
      {view === "map" && factsOpen && !picking && !draft && (
        <EraFacts
          key={`${period.decade}-${period.year}`}
          period={period}
          onClose={() => setFactsOpen(false)}
        />
      )}
      {view === "profile" && session && (
        <Profile
          onEdit={editMemory}
          onDelete={deleteMemory}
          onOpen={openPublication}
          key={profileAuthor ?? "own"}
          username={session.username}
          author={profileAuthor ?? undefined}
          reputation={profileUser?.reputacion}
          followerCount={profileUser?.cantidadSeguidores}
          followingCount={profileUser?.cantidadSeguidos}
          isFollowing={profileUser ? followingUsers.some(user => user.id === profileUser.id) : false}
          onBack={() => {setSelectedId(null);setView("feed");}}
          community={profileAuthor === null ? communityControls(true) : undefined}
          allMemories={profileMemories}
          repostedPublicationIds={repostedPublicationIds}
          tierProgress={tierProgress}
          followers={followers}
          followedUsers={followingUsers}
          period={period}
          selected={selected}
          earned={earned}
          onSelect={(m) => setSelectedId(m?.id ?? null)}
          onAdd={startAdding}
          onIniciarChat={profileAuthor ? iniciarChatConUsuario : undefined}
          onToggleFollow={profileAuthor && profileUser ? () => toggleFollow(profileUser.username, profileUser.id) : undefined}
        />
      )}
      <div hidden={view !== "feed"}>
        <SocialFeed
          key={session?.usuarioId ?? 'guest'}
          active={view === 'feed'}
          onItems={setFeedItems}
          filterFeed={items => filterMemories(filterCommunity(items, scope, myGroups, query), period, category)}
          onAddHashtag={tag => { startAdding(); setDraftHashtags([tag]); }}
          onTabChange={(tab: FeedTab) => {
            if (tab === 'groups') {
              chooseScope('groups');
              return;
            }
            if (scope === 'groups' || groups.some(group => group.id === scope)) chooseScope('all');
          }}
          onEdit={editMemory}
          onDelete={deleteMemory}
          onProfile={openProfile}
          groupIds={groups.map(group => group.id)}
          suggestedAuthors={[
            ...dbMemories.filter(memory => memory.authorId).map(memory => ({ name: memory.author, id: memory.authorId! })),
            ...followers.map(user => ({ name: user.username, id: user.id })),
          ]}
          groupOpenRequest={groupOpenRequest}
          community={communityControls()}
          groupName={groups.find(g=>g.id===scope)?.name}
          decade={period.decade}
          memories={filterMemories(filterCommunity(communityMemories, scope, groups, query), period, category)}
          following={following}
          followingRevision={followingRevision}
          onFollow={toggleFollow}
          ratings={ratings}
          pointsMap={pointsMap}
          canRate={canRate}
          onRate={rateMemory}
          selected={selected}
          onSelect={(m) => { selectedSeed.current = m; setRemoteSelected(m); setSelectedId(m?.id ?? null); }}
          onMap={(m) => {
            selectedSeed.current = m;
            setRemoteSelected(m);
            setView("map");
            setSelectedId(m.id);
            setPanelOpen(false);
            setFactsOpen(false);
          }}
          onAdd={startAdding}
          onRepostCreated={id => setRepostedPublicationIds(current => [...new Set([...current, id])])}
        />
      </div>
      {session && <Chat decade={period.decade} fullPage={view === "chat"} onOpenPage={() => {setView("chat");setPanelOpen(false);setFactsOpen(false);setPicking(false);}} hidden={picking || !!draft} chatearCon={chatearCon}/>}
      <Player
        key={period.decade}
        decade={period.decade}
        expanded={musicOpen}
        onToggle={() => {
          setMusicOpen(!musicOpen);
          if (window.innerWidth < 900) {
            setPanelOpen(false);
            setFactsOpen(false);
          }
        }}
      />
      {apiStatus && <div className="toast" role="status">{apiStatus}{apiStatus.startsWith('No se pud') && <button onClick={() => setMapRevision(value => value + 1)}>Reintentar</button>}</div>}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Cerrar aviso"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {celebrating && (
        <AchievementToast
          key={celebrating.id}
          achievement={celebrating}
          onDismiss={() => setCelebrating(null)}
        />
      )}
      {mapExpanded && view === "feed" && (
        <MapModal
          onOpen={openPublication}
          memories={memories}
          selected={selected}
          onSelect={(m) => setSelectedId(m.id)}
          onClose={() => {
            setMapExpanded(false);
            requestAnimationFrame(() => mapExpandButton.current?.focus());
          }}
        />
      )}
      {deleting && <DeleteMemoryDialog memory={deleting} onCancel={() => setDeleting(null)} onConfirm={() => confirmDelete(deleting)}/>}
      {groupInfo && <GroupInfoModal key={groupInfo.id} group={groupInfo} memoryCount={scope===groupInfo.id?groupMemories.length:0} onClose={()=>setGroupInfoId(null)} onUpdated={groupUpdated} onDeleted={groupId=>groupRemoved(groupId,'Grupo eliminado. Sus recuerdos se conservaron como publicaciones generales.')} onLeft={groupId=>groupRemoved(groupId,'Saliste del grupo.')} onOpenMember={openMemberProfile}/>}
      {editing && <MemoryForm key={editing.id} initial={editing} point={{lat:editing.lat,lng:editing.lng}} decade={Math.floor(editing.year / 10) * 10 as Decade} groupName={myGroups.find(g => g.id === editing.groupId)?.name} onCancel={() => setEditing(null)} onSave={saveEdit}/>}
      {draft && (
        <MemoryForm
          defaultHashtags={draftHashtags}
          groupName={myGroups.find(g=>g.id===publishingGroupId)?.name}
          point={draft}
          decade={myGroups.find(g=>g.id===publishingGroupId)?.decade ?? period.decade}
          onCancel={cancel}
          onSave={save}
        />
      )}
    </div>
  );
}
