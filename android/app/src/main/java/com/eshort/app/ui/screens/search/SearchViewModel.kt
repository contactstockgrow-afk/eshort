package com.eshort.app.ui.screens.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.eshort.app.data.model.*
import com.eshort.app.data.repository.VideoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class SearchUiState(
    val query: String = "",
    val isSearchActive: Boolean = false,
    val isLoading: Boolean = false,
    val searchResult: SearchResult? = null,
    val suggestions: List<SearchSuggestion> = emptyList(),
    val trendingData: TrendingData? = null
)

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val videoRepository: VideoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    private var suggestionsJob: Job? = null

    init {
        loadTrending()
    }

    private fun loadTrending() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            videoRepository.getTrending().fold(
                onSuccess = { data ->
                    _uiState.update { it.copy(trendingData = data, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }

    fun updateQuery(query: String) {
        _uiState.update { it.copy(query = query, searchResult = if (query.isEmpty()) null else it.searchResult) }

        suggestionsJob?.cancel()
        if (query.length >= 2) {
            suggestionsJob = viewModelScope.launch {
                delay(300)
                videoRepository.getSearchSuggestions(query).fold(
                    onSuccess = { suggestions ->
                        _uiState.update { it.copy(suggestions = suggestions) }
                    },
                    onFailure = { }
                )
            }
        } else {
            _uiState.update { it.copy(suggestions = emptyList()) }
        }
    }

    fun search() {
        val query = _uiState.value.query
        if (query.isBlank()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, isSearchActive = false, suggestions = emptyList()) }
            videoRepository.search(query).fold(
                onSuccess = { result ->
                    _uiState.update { it.copy(searchResult = result, isLoading = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false) }
                }
            )
        }
    }

    fun setSearchActive(active: Boolean) {
        _uiState.update { it.copy(isSearchActive = active) }
    }
}
