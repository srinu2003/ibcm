# B.Tech Project Report LaTeX Template
---
**Description**:  
This LaTeX template is designed for creating a professional project report for B.Tech students. It includes a structured format with predefined sections for the title page, abstract, acknowledgment, table of contents, main content, bibliography, and appendices. The template adheres to academic standards and is customizable to suit specific requirements.

---

**How to Use**:  
1. **Edit Variables**:  
   Start by editing the `variables.tex` file to update project-specific details such as the title, student names, guide details, and institution information.  
   
2. **Preliminary Pages**:  
   - After caompleting the report, update the `abstract.tex` file with a concise summary of your project.  
   - Modify `acknowledgment.tex` to include your acknowledgments.  

3. **Main Content**:  
   - Write your chapters in `main-content.tex`.  
   - Follow the structure provided: Introduction, Literature Review, Methodology, Results, and Conclusion.  

4. **Bibliography**:  
   Add your references in references.bib or directly in `bibliography.tex`.  

5. **Appendices**:  
   Include supplementary material in `appendices.tex`.

---

**Order of Editing**:  
1. `variables.tex`  
2. `acknowledgment.tex`  
3. `main-content.tex`  
4. `bibliography.tex`  
5. `abstract.tex`  
6. `appendices.tex`

---

**Credits**:  
- Template Author: [Srinivas Rao Tammireddy](https://github.com/srinu2003)  
- Institution: Marri Laxman Reddy Institute of Technology and Management  
- Special thanks to all contributors and guides for their support.  

---

**Using the Template in VS Code**:  
To use this LaTeX template in Visual Studio Code, follow these steps:

1. **Install VS Code**:  
   Download and install [Visual Studio Code](https://code.visualstudio.com/).

2. **Install LaTeX Workshop Extension**:  
   - Open VS Code.
   - Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or pressing `Ctrl+Shift+X`.
   - Search for "LaTeX Workshop" and install it.

3. **Install LaTeX Distribution**:  
   Ensure you have a LaTeX distribution installed on your system. For example:
   - **Windows**: [MiKTeX](https://miktex.org/) or [TeX Live](https://www.tug.org/texlive/).
   - **Linux**: Install TeX Live using your package manager.
   - **Mac**: [MacTeX](https://www.tug.org/mactex/).

4. **Set Up the Minted Package**:  
   - The template uses the `minted` package for code highlighting. Ensure you have Python installed on your system along with the `Pygments` library.
   - Install `Pygments` by running the following command in your terminal:  
     ```cmd
     pip install Pygments
     ```
   - Add the `-shell-escape` flag to your LaTeX compiler settings in VS Code. To do this:
     - Open the VS Code settings (`Ctrl+,`).
     - Search for `latex-workshop.latex.tools` and edit the configuration to include the `-shell-escape` flag. For example:
       ```json
       "latex-workshop.latex.tools": [
           {
               "name": "pdflatex",
               "command": "pdflatex",
               "args": [
                   "-synctex=1",
                   "-interaction=nonstopmode",
                   "-shell-escape",
                   "%DOC%"
               ]
           }
       ]
       ```

5. **Compile the Template**:  
   - Open the main `.tex` file in VS Code.
   - Use the `Ctrl+Alt+B` shortcut or click on the "Build LaTeX project" option in the LaTeX Workshop panel to compile the document.

6. **View the Output**:  
   - After successful compilation, the PDF will be generated in the `output` folder (or the same directory as the `.tex` file).
   - Use the built-in PDF viewer in VS Code to preview the document.

---

**Note**:  
If you encounter any issues with the `minted` package or compilation, ensure that the `-shell-escape` flag is correctly set and that `Pygments` is installed.
