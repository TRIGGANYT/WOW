import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TeamMember {
  _id: string;
  email: string;
  username?: string;
}

export interface Team {
  _id: string;
  name: string;
  description: string;
  icon: string;
  members: TeamMember[];
  dissolveVotes: TeamMember[];
  maxMembers: number;
  creator: TeamMember | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoteDissolveResponse {
  dissolved: boolean;
  team?: Team;
  votesNeeded?: number;
  currentVotes?: number;
  message?: string;
  teamId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = '/api/teams';

  constructor(private http: HttpClient) {}

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl);
  }

  getTeamById(teamId: string): Observable<Team> {
    return this.http.get<Team>(`${this.apiUrl}/${teamId}`);
  }

  createTeam(data: { name: string; description: string; icon: string; maxMembers: number; creatorId?: string }): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, data);
  }

  joinTeam(teamId: string, userId: string): Observable<Team> {
    return this.http.post<Team>(`${this.apiUrl}/${teamId}/join`, { userId });
  }

  leaveTeam(teamId: string, userId: string): Observable<Team> {
    return this.http.delete<Team>(`${this.apiUrl}/${teamId}/leave`, { body: { userId } });
  }

  deleteTeam(teamId: string): Observable<{ message: string; teamId: string }> {
    return this.http.delete<{ message: string; teamId: string }>(`${this.apiUrl}/${teamId}`);
  }

  voteDissolve(teamId: string, userId: string): Observable<VoteDissolveResponse> {
    return this.http.post<VoteDissolveResponse>(`${this.apiUrl}/${teamId}/vote-dissolve`, { userId });
  }

  // Chat methods
  getMessages(teamId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/${teamId}/messages`);
  }

  sendMessage(teamId: string, userId: string, text: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/${teamId}/messages`, { userId, text });
  }

  rateMember(teamId: string, raterId: string, ratedUserId: string, stars: number): Observable<{ message: string; xpAwarded: number }> {
    return this.http.post<{ message: string; xpAwarded: number }>(`${this.apiUrl}/${teamId}/rate`, { raterId, ratedUserId, stars });
  }
}

export interface ChatMessage {
  _id: string;
  team: string;
  sender: {
    _id: string;
    email: string;
    username?: string;
  };
  text: string;
  createdAt: string;
}
